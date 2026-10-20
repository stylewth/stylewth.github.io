import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import sharp from 'sharp';

const DEFAULT_SOURCE_ROOT = 'D:/图片/精选作品';
const DEFAULT_SELECTION = 'E:/资料/个人/摄影作品集设计/24张策展清单.csv';
const DEFAULT_NOTES = 'D:/图片/精选作品/作品评审/个人网站摄影选片名单.json';
const WEBP_WIDTHS = [640, 1000, 1600];
const JPEG_WIDTH = 1600;
const FULL_EDGE = 2400;
const ALT_TEXT_BY_ID = {
  'photo-001': '晨光照亮层叠的火山与云海',
  'photo-002': '两人牵手回望，门洞构成框景',
  'photo-003': '红白灯塔与蓝绿色海面',
  'photo-004': '行者站在巨大的火山口旁',
  'photo-005': '环形人群举手，手臂彼此相连',
  'photo-006': '光束落在湿润岩石、苔藓与瀑布上',
  'photo-007': '大小渔船停在滩涂，天空映着晚霞',
  'photo-008': '火烈鸟颈部弯曲，水面映出倒影与涟漪',
  'photo-009': '冲浪者拿着冲浪板走过金色水面',
  'photo-010': '暖色教堂矗立在密集的楼群之间',
  'photo-011': '孩子迈步，身旁的人也做出相应动作',
  'photo-012': '蓝色海面上有一面白帆',
  'photo-013': '孩子递出饮料，旁边铜像伸出手势',
  'photo-014': '逆光穿过雪雾，山谷向远处延伸',
  'photo-015': '屋顶、走廊和石径形成几何线条',
  'photo-016': '动物爪子靠近网格',
  'photo-017': '骑行者经过雨中的湿石路',
  'photo-018': '晨雾笼罩树林、村落与山谷',
  'photo-019': '白色灯塔立在浅蓝水面前，天空呈淡紫色',
  'photo-020': '蝴蝶停在花枝上',
  'photo-021': '白色崖壁沿弯曲海岸线延伸，天空阴云密布',
  'photo-022': '空中的麦克风掠过舞台灯光与烟雾',
  'photo-023': '旧河涌与倒影前方是高楼',
  'photo-024': '粉色花朵映衬白墙与天空',
};

function parseArguments(args) {
  const values = {
    sourceRoot: DEFAULT_SOURCE_ROOT,
    selection: DEFAULT_SELECTION,
    notes: DEFAULT_NOTES,
  };
  for (let index = 0; index < args.length; index += 1) {
    const [rawName, inlineValue] = args[index].split('=', 2);
    const name = rawName.startsWith('--') ? rawName.slice(2) : '';
    const key = name === 'source-root' ? 'sourceRoot' : name === 'selection' ? 'selection' : name === 'notes' ? 'notes' : null;
    if (!key) throw new Error(`Unknown argument: ${args[index]}`);
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
    values[key] = resolve(value);
  }
  return values;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else value += char;
  }
  if (quoted) throw new Error('Selection CSV contains an unterminated quoted field');
  if (row.length || value) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }
  const [headers, ...records] = rows;
  if (!headers?.length) throw new Error('Selection CSV is empty');
  return records.filter((record) => record.some((field) => field !== '')).map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])),
  );
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function dimensionsAfterOrientation(metadata) {
  const swapsDimensions = [5, 6, 7, 8].includes(metadata.orientation);
  return swapsDimensions
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
}

function isWithin(parent, child) {
  const relative = resolve(child).slice(resolve(parent).length).replaceAll('\\', '/');
  return resolve(parent) === resolve(child) || (relative.startsWith('/') && !relative.startsWith('/..'));
}

async function writeVariant(inputPath, outputPath, { width, height, format }) {
  let pipeline = sharp(inputPath).rotate().toColourspace('srgb').resize({
    width,
    height,
    fit: 'inside',
    withoutEnlargement: true,
  });
  pipeline = format === 'webp'
    ? pipeline.webp({ quality: 82, effort: 5 })
    : pipeline.jpeg({ quality: 88, mozjpeg: true, progressive: true });
  await pipeline.toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  const bytes = statSync(outputPath).size;
  if (metadata.exif || metadata.iptc || metadata.xmp || metadata.icc) {
    throw new Error(`Unexpected metadata retained in ${outputPath}`);
  }
  return {
    width: metadata.width,
    height: metadata.height,
    aspectRatio: Number((metadata.width / metadata.height).toFixed(6)),
    bytes,
    sha256: digest(outputPath),
    hasExif: Boolean(metadata.exif),
  };
}

async function main() {
  const { sourceRoot, selection, notes } = parseArguments(process.argv.slice(2));
  const outputRoot = resolve(process.cwd());
  const resolvedSourceRoot = resolve(sourceRoot);
  const workspacePublicRoot = resolve(outputRoot, 'public', 'images', 'photography');
  const containedPublicPath = workspacePublicRoot.startsWith(`${outputRoot}${sep}`);
  if (!containedPublicPath || workspacePublicRoot !== join(outputRoot, 'public', 'images', 'photography')) {
    throw new Error(`Refusing to clean a path outside the current workspace: ${workspacePublicRoot}`);
  }
  if (isWithin(resolvedSourceRoot, outputRoot) || isWithin(outputRoot, resolvedSourceRoot)) {
    throw new Error(`Source root overlaps the workspace: ${resolvedSourceRoot}`);
  }
  const rows = parseCsv(readFileSync(selection, 'utf8'));
  const noteRows = JSON.parse(readFileSync(notes, 'utf8'));
  const notesByTitle = new Map(noteRows.map((note) => [note.title, note]));
  if (rows.length !== 24) throw new Error(`Expected 24 selected photos, received ${rows.length}`);
  const ids = new Set();
  const orders = new Set();
  for (const [index, row] of rows.entries()) {
    const numericOrder = Number(row.order);
    if (!/^photo-\d{3}$/.test(row.id)) throw new Error(`Row ${index + 2}: invalid stable id ${row.id}`);
    if (ids.has(row.id)) throw new Error(`Duplicate photo id: ${row.id}`);
    if (!Number.isInteger(numericOrder) || numericOrder < 1 || numericOrder > rows.length) throw new Error(`Row ${index + 2}: order must be between 1 and ${rows.length}`);
    if (orders.has(String(numericOrder))) throw new Error(`Duplicate order: ${row.order}`);
    if (!row.title || !row.category || !row.series || !row.filename) throw new Error(`Row ${index + 2}: missing required selection fields`);
    const note = notesByTitle.get(row.title);
    if (!note || note.filename !== row.filename || note.category !== row.category) {
      throw new Error(`Selection notes do not match CSV row ${row.id}`);
    }
    row.order = String(numericOrder);
    row.alt = ALT_TEXT_BY_ID[row.id];
    if (!row.alt) throw new Error(`No factual alt text is defined for ${row.id}`);
    ids.add(row.id);
    orders.add(String(numericOrder));
  }
  for (let order = 1; order <= rows.length; order += 1) {
    if (!orders.has(String(order))) throw new Error(`Selection must include every order from 1 through ${rows.length}`);
  }
  rows.sort((left, right) => Number(left.order) - Number(right.order));

  const publicRoot = workspacePublicRoot;
  const dataDirectory = join(outputRoot, 'src', 'data');
  const auditDirectory = join(outputRoot, 'docs', 'performance');
  const originalsBefore = {};
  const outputRecords = [];
  const auditEntries = [];
  const preparedRows = [];

  for (const row of rows) {
    const sourcePath = join(resolvedSourceRoot, row.category, row.filename);
    let sourceStat;
    try {
      sourceStat = statSync(sourcePath);
    } catch {
      throw new Error(`Missing source photo: ${sourcePath} (selection order ${row.order})`);
    }
    if (!sourceStat.isFile()) throw new Error(`Source is not a file: ${sourcePath}`);
    const sourceHash = digest(sourcePath);
    const originalMetadata = await sharp(sourcePath).metadata();
    if (!originalMetadata.width || !originalMetadata.height) throw new Error(`Unable to read dimensions: ${sourcePath}`);
    const originalDimensions = dimensionsAfterOrientation(originalMetadata);
    originalsBefore[row.id] = { path: row.filename, sha256: sourceHash, bytes: sourceStat.size };
    preparedRows.push({ row, sourcePath, sourceHash, originalDimensions });
  }

  if (existsSync(publicRoot)) {
    for (const filename of readdirSync(publicRoot)) {
      if (/^\.prepare-photo-\d{3}-\d+$/.test(filename)) {
        const stalePath = join(publicRoot, filename);
        if (!isWithin(publicRoot, stalePath)) throw new Error(`Refusing to clean outside photography output: ${stalePath}`);
        rmSync(stalePath, { recursive: true, force: true });
      }
    }
  }

  for (const prepared of preparedRows) {
    const { row, sourcePath, originalDimensions } = prepared;
    const photoId = row.id;
    const relativeSource = row.filename;
    const folder = join(publicRoot, photoId);
    if (!isWithin(publicRoot, folder)) throw new Error(`Refusing to write outside photography output: ${photoId}`);
    if (existsSync(folder)) rmSync(folder, { recursive: true, force: true });
    mkdirSync(folder, { recursive: true });
    const variants = {};

    for (const width of WEBP_WIDTHS) {
      const filename = `${photoId}-${width}.webp`;
      const path = join(folder, filename);
      variants[`${width}Webp`] = await writeVariant(sourcePath, path, { width, format: 'webp' });
    }
    const fallbackName = `${photoId}-1600.jpg`;
    variants.fallbackJpeg = await writeVariant(sourcePath, join(folder, fallbackName), { width: JPEG_WIDTH, format: 'jpeg' });
    const fullName = `${photoId}-full.jpg`;
    variants.fullJpeg = await writeVariant(sourcePath, join(folder, fullName), { width: FULL_EDGE, height: FULL_EDGE, format: 'jpeg' });

    const baseUrl = `/images/photography/${photoId}`;
    const srcSet = WEBP_WIDTHS.map((width) => `${baseUrl}/${photoId}-${width}.webp ${width}w`).join(', ');
    const alt = row.alt?.trim() || row.title;
    outputRecords.push({
      id: photoId,
      order: Number(row.order),
      title: row.title,
      category: row.category,
      series: row.series,
      width: originalDimensions.width,
      height: originalDimensions.height,
      alt,
      src: `${baseUrl}/${photoId}-1000.webp`,
      fallback: `${baseUrl}/${fallbackName}`,
      srcSet,
      fullSrc: `${baseUrl}/${fullName}`,
    });
    auditEntries.push({
      id: photoId,
      source: { category: row.category, filename: relativeSource, width: originalDimensions.width, height: originalDimensions.height },
      derivatives: {
        webp640: { path: `${baseUrl}/${photoId}-640.webp`, ...variants['640Webp'] },
        webp1000: { path: `${baseUrl}/${photoId}-1000.webp`, ...variants['1000Webp'] },
        webp1600: { path: `${baseUrl}/${photoId}-1600.webp`, ...variants['1600Webp'] },
        jpeg1600: { path: `${baseUrl}/${fallbackName}`, ...variants.fallbackJpeg },
        jpegFull: { path: `${baseUrl}/${fullName}`, ...variants.fullJpeg },
      },
    });
  }

  const originalsAfter = {};
  for (const prepared of preparedRows) {
    const { row, sourcePath, sourceHash } = prepared;
    const hash = digest(sourcePath);
    originalsAfter[row.id] = { path: row.filename, sha256: hash, bytes: statSync(sourcePath).size };
    if (hash !== sourceHash) throw new Error(`Source changed during preparation: ${sourcePath}`);
  }

  mkdirSync(publicRoot, { recursive: true });

  mkdirSync(dataDirectory, { recursive: true });
  mkdirSync(auditDirectory, { recursive: true });
  const manifestPath = join(dataDirectory, 'photography.json');
  writeFileSync(manifestPath, `${JSON.stringify(outputRecords, null, 2)}\n`, 'utf8');
  const galleryWebp640Bytes = auditEntries.reduce((total, entry) => total + entry.derivatives.webp640.bytes, 0);
  const galleryWebp1000Bytes = auditEntries.reduce((total, entry) => total + entry.derivatives.webp1000.bytes, 0);
  const galleryWebp1600Bytes = auditEntries.reduce((total, entry) => total + entry.derivatives.webp1600.bytes, 0);
  const galleryFallbackJpegBytes = auditEntries.reduce((total, entry) => total + entry.derivatives.jpeg1600.bytes, 0);
  const galleryBytes = galleryWebp640Bytes + galleryWebp1000Bytes + galleryWebp1600Bytes + galleryFallbackJpegBytes;
  const viewerBytes = auditEntries.reduce((total, entry) => total + entry.derivatives.jpegFull.bytes, 0);
  const allBytes = galleryBytes + viewerBytes;
  const audit = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    selection: basename(selection),
    photoCount: rows.length,
    gallery: {
      imageCount: rows.length,
      format: 'WebP srcSet plus JPEG fallback',
      derivativeCount: rows.length * 4,
      webp640Bytes: galleryWebp640Bytes,
      webp1000Bytes: galleryWebp1000Bytes,
      webp1600Bytes: galleryWebp1600Bytes,
      jpegFallbackBytes: galleryFallbackJpegBytes,
      displayPayloadBytes: galleryWebp1000Bytes,
      bytes: galleryBytes,
    },
    viewer: { imageCount: rows.length, format: 'JPEG, longest edge at most 2400px', derivativeCount: rows.length, bytes: viewerBytes },
    totalDerivativeCount: rows.length * 5,
    totalBytes: allBytes,
    originalHashes: { before: originalsBefore, after: originalsAfter, unchanged: true },
    photos: auditEntries,
  };
  writeFileSync(join(auditDirectory, '2026-10-08-photography-images.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    photos: rows.length,
    galleryWebp640Bytes,
    galleryWebp1000Bytes,
    galleryWebp1600Bytes,
    galleryFallbackJpegBytes,
    galleryAllDerivativesBytes: galleryBytes,
    viewerBytes,
    totalDerivativeBytes: allBytes,
    manifest: manifestPath,
    audit: join(auditDirectory, '2026-10-08-photography-images.json'),
  }, null, 2)}\n`);
}

await main();
