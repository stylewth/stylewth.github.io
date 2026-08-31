import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const contentRoot = join(projectRoot, 'src', 'content');
const ignoredDirectories = new Set([
  '.git',
  '.superpowers',
  'node_modules',
  'dist',
  '.astro',
  '.npm-cache',
  'tests',
]);
const forbiddenExtensions = new Set(['.pdf', '.docx', '.tex', '.log', '.aux', '.pptx']);
const sourceExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mts', '.ts']);
const forbiddenText = [
  '18138390826',
  'GPA',
  '\u62a4\u7167',
  '\u82f1\u56fd\u7b7e\u8bc1',
  'Download CV',
];
const forbiddenPathParts = new Set(['cv', 'cvs', 'resume', 'resumes']);
const designSourceExtensions = new Set(['.astro', '.css']);

type ApprovedFavorite = readonly [
  file: string,
  rank: number,
  title: string,
  year: number,
  creator: string,
  providerId: number | string,
  sourceUrl: string,
];

const approvedFilmRecords: ApprovedFavorite[] = [
  [
    '01-taxi-driver.md',
    1,
    'Taxi Driver',
    1976,
    'Martin Scorsese',
    103,
    'https://www.themoviedb.org/movie/103',
  ],
  [
    '02-a-beautiful-mind.md',
    2,
    'A Beautiful Mind',
    2001,
    'Ron Howard',
    453,
    'https://www.themoviedb.org/movie/453',
  ],
  [
    '03-interstellar.md',
    3,
    'Interstellar',
    2014,
    'Christopher Nolan',
    157336,
    'https://www.themoviedb.org/movie/157336',
  ],
  [
    '04-eat-drink-man-woman.md',
    4,
    'Eat Drink Man Woman',
    1994,
    'Ang Lee',
    10451,
    'https://www.themoviedb.org/movie/10451',
  ],
  [
    '05-titanic.md',
    5,
    'Titanic',
    1997,
    'James Cameron',
    597,
    'https://www.themoviedb.org/movie/597',
  ],
  [
    '06-burning.md',
    6,
    'Burning',
    2018,
    'Lee Chang-dong',
    491584,
    'https://www.themoviedb.org/movie/491584',
  ],
  [
    '07-paprika.md',
    7,
    'Paprika',
    2006,
    'Satoshi Kon',
    4977,
    'https://www.themoviedb.org/movie/4977',
  ],
  [
    '08-in-the-mood-for-love.md',
    8,
    'In the Mood for Love',
    2000,
    'Wong Kar-wai',
    843,
    'https://www.themoviedb.org/movie/843',
  ],
  [
    '09-love-letter.md',
    9,
    'Love Letter',
    1995,
    'Shunji Iwai',
    47002,
    'https://www.themoviedb.org/movie/47002',
  ],
  [
    '10-the-prestige.md',
    10,
    'The Prestige',
    2006,
    'Christopher Nolan',
    1124,
    'https://www.themoviedb.org/movie/1124',
  ],
];

const approvedAlbumRecords: ApprovedFavorite[] = [
  [
    '01-the-dark-side-of-the-moon.md',
    1,
    'The Dark Side of the Moon',
    1973,
    'Pink Floyd',
    '4LH4d3cOWNNsVw41Gqt2kv',
    'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv',
  ],
  [
    '02-the-key.md',
    2,
    'The Key',
    2013,
    'Eason Chan',
    '0wWuBzOyOFxzfSPr9HSehB',
    'https://open.spotify.com/album/0wWuBzOyOFxzfSPr9HSehB',
  ],
  [
    '03-heisei-fuuzoku.md',
    3,
    'Heisei Fuuzoku - Japanese Manners',
    2007,
    'Sheena Ringo × Neko Saito',
    '7jl8ThqlDTqSff9Dam29wM',
    'https://open.spotify.com/album/7jl8ThqlDTqSff9Dam29wM',
  ],
  [
    '04-ok-computer.md',
    4,
    'OK Computer',
    1997,
    'Radiohead',
    '7dxKtc08dYeRVHt3p9CZJn',
    'https://open.spotify.com/album/7dxKtc08dYeRVHt3p9CZJn',
  ],
  [
    '05-karuki-zahmen-kuri-no-hana.md',
    5,
    'Karuki Zahmen Kuri No Hana - Kalk Samen Chestnut Flower',
    2003,
    'Sheena Ringo',
    '2i4fy6a51XTaZOYA8rIdRK',
    'https://open.spotify.com/album/2i4fy6a51XTaZOYA8rIdRK',
  ],
  [
    '06-inside-the-cable-temple.md',
    6,
    'Inside the Cable Temple',
    2020,
    'Omnipotent Youth Society',
    '6ValxpcsrkQP2ugCU2Kxwy',
    'https://open.spotify.com/album/6ValxpcsrkQP2ugCU2Kxwy',
  ],
  [
    '07-siamese-dream.md',
    7,
    'Siamese Dream',
    1993,
    'The Smashing Pumpkins',
    '4UVERYsIzs6xbDYO8srlqd',
    'https://open.spotify.com/album/4UVERYsIzs6xbDYO8srlqd',
  ],
  [
    '08-crimson.md',
    8,
    'CRIMSON',
    1986,
    'Akina Nakamori',
    '6QOn35uhhnotiad01xwGaN',
    'https://open.spotify.com/album/6QOn35uhhnotiad01xwGaN',
  ],
  [
    '09-selling-england-by-the-pound.md',
    9,
    'Selling England by the Pound',
    1973,
    'Genesis',
    '7xaM3ah9ZO4BjrcFj5vOZe',
    'https://open.spotify.com/album/7xaM3ah9ZO4BjrcFj5vOZe',
  ],
  [
    '10-good-kid-maad-city.md',
    10,
    'good kid, m.A.A.d city',
    2012,
    'Kendrick Lamar',
    '6PBZN8cbwkqm1ERj2BGXJ1',
    'https://open.spotify.com/album/6PBZN8cbwkqm1ERj2BGXJ1',
  ],
];

function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(directory, entry));
}

function projectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : projectFiles(join(directory, entry.name));
    }

    return [join(directory, entry.name)];
  });
}

async function pngAlphaRange(path: string): Promise<{ min: number; max: number }> {
  const metadata = await sharp(path).metadata();
  expect(metadata.format, path).toBe('png');
  expect(metadata.hasAlpha, path).toBe(true);

  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let min = 255;
  let max = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    min = Math.min(min, data[index]);
    max = Math.max(max, data[index]);
  }
  return { min, max };
}

describe('public source contracts', () => {
  it('stores the approved research traversal as matched photographic layers', async () => {
    const imageRoot = join(projectRoot, 'src', 'assets', 'images');
    const required = [
      'research-traversal-base.png',
      'research-traversal-rabbit.png',
      'research-traversal-pane-1.png',
      'research-traversal-pane-2.png',
      'research-traversal-pane-3.png',
    ];

    required.forEach((name) => {
      const path = join(imageRoot, name);
      expect(existsSync(path), name).toBe(true);
      expect(readFileSync(path).byteLength, name).toBeGreaterThan(1_000);
    });

    for (const name of required.slice(1)) {
      const { min, max } = await pngAlphaRange(join(imageRoot, name));
      expect(min, name).toBeLessThan(255);
      expect(max, name).toBeGreaterThan(0);
    }

    const rabbit = await sharp(join(imageRoot, 'research-traversal-rabbit.png')).metadata();
    expect(rabbit.width, 'research-traversal-rabbit.png width').toBeGreaterThan(rabbit.height ?? 0);
    expect(
      existsSync(join(imageRoot, 'research-traversal-foreground.png')),
      'research-traversal-foreground.png must not exist',
    ).toBe(false);
  });

  it('contains exactly the approved initial content records', () => {
    expect(markdownFiles(join(contentRoot, 'projects'))).toHaveLength(2);
    expect(markdownFiles(join(contentRoot, 'updates'))).toHaveLength(3);
    expect(markdownFiles(join(contentRoot, 'elsewhere'))).toHaveLength(1);
  });

  it('contains the approved Top 10 films and albums with provider references', () => {
    const filmRoot = join(contentRoot, 'favorites', 'film');
    const albumRoot = join(contentRoot, 'favorites', 'album');
    const imageRoot = join(projectRoot, 'src', 'assets', 'images', 'favorites');
    const films = existsSync(filmRoot)
      ? readdirSync(filmRoot).filter((file) => file.endsWith('.md')).sort()
      : [];
    const albums = existsSync(albumRoot)
      ? readdirSync(albumRoot).filter((file) => file.endsWith('.md')).sort()
      : [];
    const approvedRecords = [
      ...approvedFilmRecords.map((record) => ['film', filmRoot, record] as const),
      ...approvedAlbumRecords.map((record) => ['album', albumRoot, record] as const),
    ];
    const favoriteImages = existsSync(imageRoot)
      ? projectFiles(imageRoot).filter((file) =>
          ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(file).toLowerCase()),
        )
      : [];

    expect(films).toEqual(approvedFilmRecords.map(([file]) => file));
    expect(albums).toEqual(approvedAlbumRecords.map(([file]) => file));
    expect(favoriteImages).toHaveLength(0);

    approvedRecords.forEach(([kind, root, record]) => {
      const [file, rank, title, year, creator, providerId, sourceUrl] = record;
      const content = readFileSync(join(root, file), 'utf8');
      expect(content).toContain(`title: ${title}`);
      expect(content).toContain(`kind: ${kind}`);
      expect(content).toContain(`rank: ${rank}`);
      expect(content).toContain(`year: ${year}`);
      expect(content).toContain(`creator: ${creator}`);
      if (kind === 'film') {
        expect(content).toContain(`tmdbId: ${providerId}`);
        expect(sourceUrl).toBe(`https://www.themoviedb.org/movie/${providerId}`);
      } else {
        expect(content).toContain(`spotifyUrl: ${sourceUrl}`);
        expect(sourceUrl).toBe(`https://open.spotify.com/album/${providerId}`);
      }
      expect(content).not.toMatch(/^cover:/m);
      expect(content).not.toMatch(/^coverSourceUrl:/m);
      expect(content).not.toMatch(/^coverCredit:/m);
      expect(content).not.toMatch(/^editionNote:/m);
      expect(content).not.toMatch(/^review:/m);
      expect(content).not.toContain('.invalid');
    });
  });

  it('publishes linked provider credits and keeps favorite artwork remote', () => {
    const stage = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );
    const copy = readFileSync(join(projectRoot, 'src', 'i18n', 'en.ts'), 'utf8');
    const notices = readFileSync(join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8');
    const favoriteImageRoot = join(projectRoot, 'src', 'assets', 'images', 'favorites');

    expect(stage).toContain('class="favorites-stage__credits"');
    expect(stage).toContain('href="https://www.themoviedb.org"');
    expect(stage).toContain('src="/brands/tmdb.svg"');
    expect(stage).toContain('href="https://open.spotify.com"');
    expect(stage).toContain('src="/brands/spotify.svg"');
    expect(copy).toContain(
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    );
    expect(existsSync(join(projectRoot, 'public', 'brands', 'tmdb.svg'))).toBe(true);
    expect(existsSync(join(projectRoot, 'public', 'brands', 'spotify.svg'))).toBe(true);
    expect(notices).toContain('https://developer.themoviedb.org/docs/faq');
    expect(notices).toContain('https://developer.spotify.com/documentation/design');
    expect(existsSync(favoriteImageRoot) ? projectFiles(favoriteImageRoot) : []).toHaveLength(0);
  });

  it('retains the two verified project repositories', () => {
    const projectContent = markdownFiles(join(contentRoot, 'projects'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(projectContent).toContain(
      'https://github.com/stylewth/Looking-Around-Before-Cropping-SparseNavWM',
    );
    expect(projectContent).toContain('https://github.com/stylewth/EVRP-datastructure');
  });

  it('does not publish private records or unsupported file types', () => {
    const files = projectFiles(projectRoot);
    const forbiddenFile = files.find((file) => forbiddenExtensions.has(extname(file).toLowerCase()));
    const forbiddenContent = files
      .filter(
        (file) =>
          statSync(file).isFile() &&
          sourceExtensions.has(extname(file).toLowerCase()) &&
          !file.endsWith('package-lock.json') &&
          !file.endsWith('README.md'),
      )
      .find((file) => {
        const content = readFileSync(file, 'utf8');
        return forbiddenText.some((term) => content.includes(term));
      });

    expect(forbiddenFile && relative(projectRoot, forbiddenFile)).toBeUndefined();
    expect(forbiddenContent && relative(projectRoot, forbiddenContent)).toBeUndefined();
  });

  it('keeps production source free of private directories and parent asset references', () => {
    const files = projectFiles(projectRoot);
    const privatePath = files.find((file) =>
      relative(projectRoot, file)
        .split(/[\\/]/)
        .some((part) => forbiddenPathParts.has(part.toLowerCase())),
    );
    const parentAssetReference = files
      .filter((file) => sourceExtensions.has(extname(file).toLowerCase()))
      .find((file) => {
        const content = readFileSync(file, 'utf8');
        const parentReferences = [
          ...content.matchAll(/(?:from\s*|src\s*=\s*|href\s*=\s*|url\()\s*["'](\.\.\/[^"')\s]+)/g),
        ].map((match) => match[1]);

        return parentReferences.some((reference) => relative(projectRoot, resolve(dirname(file), reference)).startsWith('..'));
      });

    expect(privatePath && relative(projectRoot, privatePath)).toBeUndefined();
    expect(parentAssetReference && relative(projectRoot, parentAssetReference)).toBeUndefined();
  });

  it('ships GitHub Pages deployment metadata without an OG image dependency', () => {
    const robotsPath = join(projectRoot, 'public', 'robots.txt');
    const workflowPath = join(projectRoot, '.github', 'workflows', 'deploy.yml');
    const seoHead = readFileSync(join(projectRoot, 'src', 'components', 'layout', 'SeoHead.astro'), 'utf8');

    expect(readFileSync(robotsPath, 'utf8')).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://stylewth.github.io/sitemap-index.xml\n',
    );
    expect(readFileSync(workflowPath, 'utf8')).toContain('actions/checkout@v7');
    expect(readFileSync(workflowPath, 'utf8')).toContain('withastro/action@v6');
    expect(readFileSync(workflowPath, 'utf8')).toContain('actions/deploy-pages@v5');
    expect(seoHead).not.toContain('og:image');
    expect(seoHead).toContain('name="twitter:card" content="summary"');
    expect(existsSync(join(projectRoot, 'public', 'og.png'))).toBe(false);
  });

  it('documents provider-backed favorite maintenance and secret-free deployment', () => {
    const readme = readFileSync(join(projectRoot, 'README.md'), 'utf8');
    const envExamplePath = join(projectRoot, '.env.example');
    const gitignore = readFileSync(join(projectRoot, '.gitignore'), 'utf8');

    expect(readme).toContain('npm install');
    expect(readme).toContain('npm run dev');
    expect(readme).toContain('npm run build');
    expect(readme).toContain('## Project Markdown example');
    expect(readme).toContain('## Update Markdown example');
    expect(readme).toContain('## Elsewhere Markdown example');
    expect(readme).toContain('## Favorite Markdown example');
    expect(readme).toContain('review is optional');
    expect(readme).toContain('exactly 10 films and 10 albums');
    expect(readme).toContain('tmdbId: 103');
    expect(readme).toContain('spotifyUrl: https://open.spotify.com/album/');
    expect(readme).toContain('npm run sync:favorites');
    expect(readme).toContain('src/data/favorite-artwork.json');
    expect(readme).toContain('GitHub Pages builds only from the committed artwork manifest.');
    expect(readme).toContain(
      'No TMDB or Spotify secret is required in the repository or GitHub Actions.',
    );
    expect(readme).toContain('Never commit `.env`.');
    expect(readme).not.toContain('coverSourceUrl');
    expect(readme).not.toContain('editionNote');
    expect(readme).not.toContain('src/assets/images/favorites');
    expect(readme).toContain('site config');
    expect(readme).toContain('i18n');
    expect(readme).toContain('CV gate');
    expect(readme).toContain('Chinese');
    expect(readme).toContain('GitHub Pages');
    expect(readme).toContain('Settings > Pages');
    expect(readme).toContain('dynamic character particles');
    expect(existsSync(envExamplePath)).toBe(true);
    if (existsSync(envExamplePath)) {
      const envExample = readFileSync(envExamplePath);
      expect(envExample.toString('utf8')).toBe('TMDB_READ_ACCESS_TOKEN=\n');
      expect([...envExample.subarray(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf]);
    }
    expect(gitignore).toMatch(/^\.env$/m);
  });

  it('defines the approved editorial design system', () => {
    const tokens = readFileSync(join(projectRoot, 'src', 'styles', 'tokens.css'), 'utf8');
    const globalStyles = readFileSync(join(projectRoot, 'src', 'styles', 'global.css'), 'utf8');
    const baseLayout = readFileSync(
      join(projectRoot, 'src', 'layouts', 'BaseLayout.astro'),
      'utf8',
    );
    const profile = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ProfileIntro.astro'),
      'utf8',
    );

    expect(tokens).toMatch(/--content-width:\s*60rem/);
    expect(tokens).toMatch(/--font-display:\s*['"]Newsreader['"]/);
    expect(tokens).toMatch(/--font-body:\s*['"]DM Sans['"]/);
    expect(tokens).toMatch(/--color-text:\s*#[01][0-9a-f]{5}/i);
    expect(tokens).toMatch(/--color-rule:\s*#[0-9a-f]{6}/i);
    expect(tokens).toMatch(/--color-bone:\s*#[0-9a-f]{6}/i);
    expect(globalStyles).toContain(':focus-visible');
    expect(profile).toMatch(/@media\s*\(max-width:\s*48rem\)/);
    expect(profile).toMatch(
      /grid-template-columns:\s*15\.625rem minmax\(0,\s*1fr\);/,
    );
    expect(profile).toMatch(/gap:\s*4rem;/);
    expect(baseLayout).toContain('@fontsource-variable/newsreader');
    expect(baseLayout).toContain('@fontsource-variable/dm-sans');
  });

  it('keeps feature-owned selectors out of global CSS', () => {
    const globalStyles = readFileSync(join(projectRoot, 'src', 'styles', 'global.css'), 'utf8');

    [
      'site-header',
      'site-name',
      'site-nav',
      'site-footer',
      'profile',
      'research-field',
      'interest-list',
      'latest-section',
      'project-list',
      'project-row',
      'update-list',
      'update-row',
      'content-page',
      'elsewhere-entry',
    ].forEach((selector) => expect(globalStyles).not.toContain(`.${selector}`));
  });

  it('keeps homepage components data-free and driven by explicit props', () => {
    const homeRoot = join(projectRoot, 'src', 'components', 'home');
    const components = [
      'ProfileIntro.astro',
      'ResearchInterests.astro',
      'LatestWork.astro',
      'LatestUpdates.astro',
    ];

    components.forEach((component) => {
      const source = readFileSync(join(homeRoot, component), 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*(?:i18n\/en|config\/site)['"]/);
      expect(source).not.toMatch(/\bget(?:Collection|Entry|Entries)\s*\(/);
      expect(source).toContain('interface Props');
    });
  });

  it('connects collection uniqueness checks to every build-time query path', () => {
    const homepage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const workArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', 'index.astro'),
      'utf8',
    );
    const workDetails = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', '[slug].astro'),
      'utf8',
    );
    const updatesArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'updates', 'index.astro'),
      'utf8',
    );
    const elsewhereArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'elsewhere', 'index.astro'),
      'utf8',
    );

    expect(homepage).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(homepage).toMatch(/assertUniqueTranslationKeys\(updates,\s*'update'\)/);
    expect(workArchive).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(workDetails).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(updatesArchive).toMatch(/assertUniqueTranslationKeys\(updates,\s*'update'\)/);
    expect(elsewhereArchive).toMatch(
      /assertUniqueTranslationKeys\(elsewhere,\s*'elsewhere'\)/,
    );
  });

  it('uses the strict reusable Elsewhere date schema without coercion', () => {
    const contentConfig = readFileSync(
      join(projectRoot, 'src', 'content.config.ts'),
      'utf8',
    );
    const dateSchemaPath = join(projectRoot, 'src', 'lib', 'content-schema.ts');

    expect(existsSync(dateSchemaPath)).toBe(true);
    if (!existsSync(dateSchemaPath)) return;
    const dateSchema = readFileSync(dateSchemaPath, 'utf8');
    expect(contentConfig).toContain('date: elsewhereDateSchema');
    expect(contentConfig).not.toContain('z.coerce.date()');
    expect(dateSchema).toContain('z.iso.date()');
    expect(dateSchema).toContain("new Date(`${value}T00:00:00.000Z`)");
  });

  it('defines strict favorite records without runtime metadata fetching', () => {
    const contentConfig = readFileSync(
      join(projectRoot, 'src', 'content.config.ts'),
      'utf8',
    );

    expect(contentConfig).toContain('const favorites = defineCollection');
    expect(contentConfig).toContain("z.discriminatedUnion('kind'");
    expect(contentConfig).toContain("kind: z.literal('film')");
    expect(contentConfig).toContain('tmdbId: z.number().int().positive()');
    expect(contentConfig).toContain("kind: z.literal('album')");
    expect(contentConfig).toContain('spotifyUrl: z');
    expect(contentConfig).toMatch(/rank:\s*z\.number\(\)\.int\(\)\.min\(1\)\.max\(10\)/);
    expect(contentConfig).toMatch(/year:\s*z\.number\(\)\.int\(\)\.min\(1900\)\.max\(9999\)/);
    expect(contentConfig).not.toContain('coverSourceUrl: z.url()');
    expect(contentConfig).not.toContain('editionNote: z.string().trim().min(1)');
    expect(contentConfig).toMatch(
      /review:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(180\)\.optional\(\)/,
    );
    expect(contentConfig).toMatch(/export const collections = \{[\s\S]*favorites/);
  });

  it('keeps the latest updates section conditional and self-contained', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const latestUpdates = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'LatestUpdates.astro'),
      'utf8',
    );

    expect(indexPage).toMatch(/latestUpdates\.length\s*>\s*0\s*&&\s*\(?\s*<LatestUpdates/);
    expect(latestUpdates).toContain('border-top: 1px solid var(--color-rule);');
    expect(latestUpdates).not.toContain('+ .latest-section');
  });

  it('gives reusable records explicit typed heading levels', () => {
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(projectRow).toContain("CollectionEntry<'projects'>");
    expect(projectRow).toMatch(/headingLevel:\s*2\s*\|\s*3/);
    expect(updateList).toContain("CollectionEntry<'updates'>");
    expect(updateList).toMatch(/headingLevel:\s*2\s*\|\s*3/);
  });

  it('passes all homepage record and accessibility labels explicitly', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const latestWork = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'LatestWork.astro'),
      'utf8',
    );
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const profile = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ProfileIntro.astro'),
      'utf8',
    );
    const research = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ResearchInterests.astro'),
      'utf8',
    );

    expect(indexPage).toMatch(
      /<ProfileIntro\s+identity=\{site\}\s+copy=\{en\.profile\}\s+portrait=\{portrait\}\s*\/>/,
    );
    expect(indexPage).toMatch(
      /<ResearchInterests[\s\S]*?copy=\{en\.research\}[\s\S]*?baseImage=\{researchBaseImage\}[\s\S]*?subjectImage=\{researchSubjectImage\}[\s\S]*?\/>/,
    );
    expect(indexPage).toMatch(
      /<LatestWork[\s\S]*?title=\{en\.work\.title\}[\s\S]*?allProjectsLabel=\{en\.work\.allProjects\}[\s\S]*?codeLabel=\{en\.links\.code\}[\s\S]*?\/>/,
    );
    expect(indexPage).toMatch(
      /<LatestUpdates[\s\S]*?title=\{en\.updates\.title\}[\s\S]*?allUpdatesLabel=\{en\.updates\.allUpdates\}[\s\S]*?\/>/,
    );
    expect(latestWork).toContain('allProjectsLabel: string');
    expect(latestWork).toContain('codeLabel: string');
    expect(projectRow).toContain('codeLabel: string');
    expect(projectRow).not.toContain('>Code</a>');
    expect(profile).toContain('portraitAlt: string');
    expect(profile).toContain('emailLabel: string');
    expect(profile).toContain('githubLabel: string');
    expect(research).toContain('interestsLabel: string');
  });

  it('owns the layered research scene and restrained motion inside its component', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const research = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ResearchInterests.astro'),
      'utf8',
    );
    const rabbitRule = research.match(/\.research-field__rabbit\s*\{([^}]*)\}/s)?.[1] ?? '';
    const farPointRule = research.match(/\.research-field__point-depth--far\s*\{([^}]*)\}/s)?.[1] ?? '';
    const middlePointRule = research.match(/\.research-field__point-depth--middle\s*\{([^}]*)\}/s)?.[1] ?? '';
    const nearPointRule = research.match(/\.research-field__point-depth--near\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(indexPage).toContain('research-traversal-base.png');
    expect(indexPage).toContain('research-traversal-rabbit.png');
    expect(indexPage.match(/research-traversal-pane-[123]\.png/g) ?? []).toHaveLength(3);
    expect(indexPage).not.toContain('research-traversal-foreground.png');
    expect(research).toContain('<research-traversal');
    expect(research).toContain("import '../../scripts/research-traversal'");
    expect(research).toContain("const paneNames = ['one', 'two', 'three'] as const;");
    expect(research.match(/data-research-pane/g) ?? []).toHaveLength(1);
    expect(research.match(/data-research-refraction/g) ?? []).toHaveLength(1);
    expect(research).not.toContain('data-research-foreground');
    expect(research).toContain('clip-path: ellipse(');
    expect(research).toContain('left: var(--research-progress)');
    expect(research.match(/data-research-rabbit/g) ?? []).toHaveLength(1);
    expect(research).toContain('data-research-photo');
    expect(research).toContain("const pointDepths = ['far', 'middle', 'near'] as const;");
    expect(research).toContain('data-research-point-layer');
    expect(research).toContain('--research-rabbit-mask');
    expect(research).toContain('mask-image: var(--research-rabbit-mask)');
    expect(research).toContain('calc(100% - var(--research-progress))');
    expect(research).toContain('calc(90% - var(--research-progress))');
    expect(rabbitRule).toMatch(/width:\s*clamp\(10rem,\s*17vw,\s*15rem\);/);
    expect(research).toMatch(
      /@media\s*\(max-width:\s*48rem\)\s*\{[\s\S]*?\.research-field__rabbit\s*\{[^}]*width:\s*8\.5rem;/,
    );
    expect(farPointRule).toMatch(/background-size:\s*17px 17px;/);
    expect(farPointRule).toMatch(/opacity:\s*\.72;/);
    expect(farPointRule).toContain("fill='%23243a4a'");
    expect(middlePointRule).toMatch(/background-size:\s*23px 23px;/);
    expect(middlePointRule).toMatch(/opacity:\s*\.86;/);
    expect(middlePointRule).toContain("fill='%2358b8c8'");
    expect(nearPointRule).toMatch(/background-size:\s*31px 31px;/);
    expect(nearPointRule).toMatch(/opacity:\s*\.98;/);
    expect(nearPointRule).toContain("fill='%23e6dfd1'");
    expect(nearPointRule).toContain("fill='%23d3a169'");
    expect(research).not.toContain('<canvas');
    expect(research).not.toContain('requestAnimationFrame(draw)');
    expect(indexPage).not.toMatch(/point[-_]cloud|pointcloud/i);
    expect(research).not.toContain('<research-motion');
    expect(research).not.toContain('data-motion-entered');
    expect(research).not.toContain('research-field__slice');
    expect(research).not.toMatch(/\.research-field__pane\s*\{[^}]*border\s*:/);
    expect(research).not.toMatch(/\b(?:box-shadow|text-shadow|filter)\s*:/);
    expect(research).not.toMatch(/glow/i);
    expect(research).not.toMatch(/\btransition(?:-[a-z-]+)?\s*:/);
    expect(research).not.toMatch(/@keyframes|\banimation\s*:/);
    expect(indexPage).toMatch(
      /<ResearchInterests[\s\S]*?copy=\{en\.research\}[\s\S]*?baseImage=\{researchBaseImage\}[\s\S]*?subjectImage=\{researchSubjectImage\}[\s\S]*?paneImages=\{researchPaneImages\}[\s\S]*?\/>/,
    );
    expect(research).toContain('paneImages: readonly [ImageMetadata, ImageMetadata, ImageMetadata]');
    expect(research).not.toContain('foregroundImage');
  });

  it('uses the content-width shell for wide archive pages and metadata config values', () => {
    const contentLayout = readFileSync(join(projectRoot, 'src', 'layouts', 'ContentLayout.astro'), 'utf8');
    const workDetail = readFileSync(join(projectRoot, 'src', 'pages', 'work', '[slug].astro'), 'utf8');
    const footer = readFileSync(join(projectRoot, 'src', 'components', 'layout', 'SiteFooter.astro'), 'utf8');

    expect(contentLayout).toContain('content-page--wide');
    expect(contentLayout).toContain('--content-width');
    expect(contentLayout).toContain('.content-page__body > :global(h2)');
    expect(contentLayout).toContain('.content-page__header > p');
    expect(contentLayout).not.toContain('.content-page__meta');
    expect(workDetail).toContain('en.metadata.year');
    expect(workDetail).toContain('en.metadata.role');
    expect(workDetail).toContain('en.metadata.topics');
    expect(workDetail).toContain('en.links.code');
    expect(workDetail).toContain('.content-page__meta');
    expect(footer).toContain('site.name');
    expect(footer).toContain('site.location');
    expect(footer).toContain('site.email');
    expect(footer).toContain('site.github');
    expect(footer).toContain('new Date().getFullYear()');
  });

  it('orders work detail metadata from compact to descriptive values', () => {
    const workDetail = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', '[slug].astro'),
      'utf8',
    );

    expect(workDetail).toMatch(
      /<dl class="content-page__meta">[\s\S]*?en\.metadata\.year[\s\S]*?en\.metadata\.stage[\s\S]*?en\.metadata\.role[\s\S]*?en\.metadata\.topics[\s\S]*?<\/dl>/,
    );
  });

  it('balances work detail metadata on desktop and preserves the single-column mobile grid', () => {
    const workDetail = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', '[slug].astro'),
      'utf8',
    );

    expect(workDetail).toMatch(
      /\.content-page__meta\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*\}/,
    );
    expect(workDetail).toMatch(
      /@media\s*\(max-width:\s*48rem\)\s*\{[\s\S]*?\.content-page__meta\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*\}[\s\S]*?\}/,
    );
  });

  it('keeps classified record metadata visible without competing selector specificity', () => {
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(projectRow).toContain('.project-row__meta .project-row__classification');
    expect(projectRow).not.toContain('!important');
    expect(updateList).toContain('.update-row > .update-row__meta');
    expect(updateList).toMatch(/\.update-row\s*>\s*\.update-row__meta\s*\{[\s\S]*font-size:\s*0\.86rem;/);
  });

  it('keeps update metadata on one desktop line and preserves the single-column mobile grid', () => {
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(updateList).toMatch(
      /\.update-row\s*\{[^}]*grid-template-columns:\s*9rem minmax\(0,\s*0\.7fr\) minmax\(0,\s*1fr\);[^}]*\}/,
    );
    expect(updateList).toMatch(
      /\.update-row\s*>\s*\.update-row__meta\s*\{[^}]*white-space:\s*nowrap;[^}]*\}/,
    );
    expect(updateList).toMatch(
      /@media\s*\(max-width:\s*48rem\)\s*\{[\s\S]*?\.update-row\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*\}[\s\S]*?\}/,
    );
  });

  it('limits content typography rules to direct body children', () => {
    const contentLayout = readFileSync(
      join(projectRoot, 'src', 'layouts', 'ContentLayout.astro'),
      'utf8',
    );

    expect(contentLayout).toMatch(/\.content-page__body\s*>\s*:global\(h2\)\s*\{/);
    expect(contentLayout).toMatch(/\.content-page__body\s*>\s*:global\(h3\)\s*\{/);
    expect(contentLayout).toMatch(
      /\.content-page__body\s*>\s*:global\(p\),\s*\.content-page__body\s*>\s*:global\(ul\),\s*\.content-page__body\s*>\s*:global\(ol\)\s*\{/,
    );
    expect(contentLayout).not.toMatch(
      /\.content-page__body\s+(?!>)[^{]*:global\((?:h2|h3|p|ul|ol)\)/,
    );
  });

  it('centralizes the accurate Elsewhere description', () => {
    const locale = readFileSync(join(projectRoot, 'src', 'i18n', 'en.ts'), 'utf8');
    const page = readFileSync(join(projectRoot, 'src', 'pages', 'elsewhere', 'index.astro'), 'utf8');

    expect(locale).toContain("description: 'Notes on music and other interests.'");
    expect(page).toContain('en.elsewhere.description');
  });

  it('implements the favorite fan as a gated, restrained visual enhancement', () => {
    const fan = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoriteFan.astro'),
      'utf8',
    );
    const stage = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );
    const source = `${fan}\n${stage}`;

    expect(source).toContain(':global(favorites-stage[data-enhanced])');
    expect(source).toContain('overflow-x: auto');
    expect(source).toContain('var(--fan-x)');
    expect(source).toContain('var(--fan-y)');
    expect(source).toContain('var(--fan-rotation)');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?favorite-card:hover \.favorite-card__trigger,[\s\S]*?favorite-card:active \.favorite-card__trigger\s*\{[^}]*transform:\s*none;/,
    );
    expect(source).not.toContain('gradient(');
    expect(source).not.toMatch(/\bfilter\s*:/);
    expect(source).not.toContain('mix-blend-mode');
    expect(source).not.toContain('border-radius');
    expect(source).not.toContain('\u2013');
    expect(source).not.toContain('\u2014');
  });

  it('resets intrinsic favorite artwork heights in cards and the focus dialog', () => {
    const fan = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoriteFan.astro'),
      'utf8',
    );
    const stage = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );

    expect(fan).toMatch(
      /\.favorite-card__trigger\s+:global\(img\)\s*\{[^}]*height:\s*auto;[^}]*\}/,
    );
    expect(stage).toMatch(
      /\.favorite-dialog__art\s+:global\(img\)\s*\{[^}]*height:\s*auto;[^}]*\}/,
    );
  });

  it('animates the focus dialog while honoring reduced-motion preferences', () => {
    const stage = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );
    const dialogOpenRule = stage.match(/\.favorite-dialog\[open\]\s*\{([^}]*)\}/)?.[1] ?? '';
    const backdropOpenRule =
      stage.match(/\.favorite-dialog\[open\]::backdrop\s*\{([^}]*)\}/)?.[1] ?? '';
    const dialogKeyframes = stage.slice(
      stage.indexOf('@keyframes favorite-dialog-enter'),
      stage.indexOf('@keyframes favorite-dialog-backdrop-enter'),
    );
    const backdropKeyframesStart = stage.indexOf('@keyframes favorite-dialog-backdrop-enter');
    const backdropKeyframes = stage.slice(
      backdropKeyframesStart,
      stage.indexOf('.favorite-dialog__close {', backdropKeyframesStart),
    );
    const reducedMotion = stage.slice(stage.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(dialogOpenRule).toMatch(
      /animation:\s*favorite-dialog-enter 240ms cubic-bezier\(0\.2, 0\.8, 0\.2, 1\) both;/,
    );
    expect(dialogKeyframes).toMatch(/@keyframes favorite-dialog-enter\s*\{/);
    expect(dialogKeyframes).toMatch(
      /from\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(0\.55rem\) scale\(0\.985\);/,
    );
    expect(dialogKeyframes).toMatch(
      /to\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*translateY\(0\) scale\(1\);/,
    );
    expect(backdropOpenRule).toMatch(
      /animation:\s*favorite-dialog-backdrop-enter 180ms ease-out both;/,
    );
    expect(backdropKeyframes).toMatch(/@keyframes favorite-dialog-backdrop-enter\s*\{/);
    expect(backdropKeyframes).toMatch(/from\s*\{[^}]*opacity:\s*0;/);
    expect(backdropKeyframes).toMatch(/to\s*\{[^}]*opacity:\s*1;/);
    expect(reducedMotion).toMatch(
      /\.favorite-dialog\[open\]\s*\{[^}]*animation:\s*none;/,
    );
    expect(reducedMotion).toMatch(
      /\.favorite-dialog\[open\]::backdrop\s*\{[^}]*animation:\s*none;/,
    );
  });

  it('restores focused cards to the fan and keeps every caption the same height', () => {
    const fan = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoriteFan.astro'),
      'utf8',
    );

    expect(fan).not.toContain('.favorite-card:focus-within');
    expect(fan).toMatch(
      /\.favorite-card__trigger:focus-visible\s*\{[^}]*outline:[^;}]+;[^}]*\}/,
    );
    expect(fan).toMatch(
      /\.favorite-card__foot\s*\{[^}]*box-sizing:\s*border-box;[^}]*height:\s*5\.6rem;[^}]*\}/,
    );
    expect(fan).not.toMatch(/\.favorite-card__foot\s*\{[^}]*min-height:/);
  });

  it('keeps enhanced favorite card placement fixed while the trigger owns hover motion', () => {
    const fan = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoriteFan.astro'),
      'utf8',
    );
    const triggerRule =
      fan.match(
        /:global\(favorites-stage\[data-enhanced\]\) \.favorite-card__trigger\s*\{([^}]*)\}/,
      )?.[1] ?? '';
    const hoverTriggerRule =
      fan.match(/\.favorite-card:hover \.favorite-card__trigger\s*\{([^}]*)\}/)?.[1] ?? '';
    const activeTriggerRule =
      fan.match(/\.favorite-card:active \.favorite-card__trigger\s*\{([^}]*)\}/)?.[1] ?? '';
    const reducedMotion = fan.slice(fan.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(fan).toMatch(
      /:global\(favorites-stage\[data-enhanced\]\) \.favorite-card\s*\{[^}]*transform:\s*[\s\S]*?var\(--fan-x\)[\s\S]*?var\(--fan-y\)[\s\S]*?var\(--fan-rotation\)[\s\S]*?;[^}]*\}/,
    );
    expect(fan).not.toMatch(
      /:global\(favorites-stage\[data-enhanced\]\) \.favorite-card\s*\{[^}]*transition\s*:/,
    );
    expect(fan).not.toMatch(
      /:global\(favorites-stage\[data-enhanced\]\) \.favorite-card:hover\s*\{[^}]*transform\s*:/,
    );
    expect(triggerRule).toMatch(/--favorite-lift:\s*0rem;/);
    expect(triggerRule).toMatch(/--favorite-scale:\s*1;/);
    expect(triggerRule).toMatch(/--favorite-visual-rotation:\s*var\(--fan-rotation\);/);
    expect(triggerRule).toMatch(
      /transform:\s*translate3d\(0,\s*var\(--favorite-lift\),\s*0\)\s*rotate\(calc\(var\(--favorite-visual-rotation\) - var\(--fan-rotation\)\)\)\s*scale\(var\(--favorite-scale\)\);/,
    );
    expect(triggerRule).toMatch(/transform-origin:\s*50% 85%;/);
    expect(triggerRule).toContain('transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)');
    expect(triggerRule).toContain('border-color 180ms ease');
    expect(triggerRule).toContain('box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1)');
    expect(triggerRule).not.toMatch(/will-change\s*:/);
    expect(fan).toMatch(/\.favorite-card:hover\s*\{[^}]*z-index:\s*30;/);

    expect(hoverTriggerRule).toMatch(/--favorite-lift:\s*-0\.7rem;/);
    expect(hoverTriggerRule).toMatch(/--favorite-scale:\s*1\.018;/);
    expect(hoverTriggerRule).toMatch(
      /--favorite-visual-rotation:\s*calc\(var\(--fan-rotation\) \* 0\.18\);/,
    );
    expect(hoverTriggerRule).toMatch(/border-color:\s*var\(--favorite-accent\);/);
    expect(hoverTriggerRule).toMatch(/rgb\(16 17 15 \/ 0\.18\)/);
    expect(hoverTriggerRule).toMatch(/rgb\(16 17 15 \/ 0\.12\)/);

    expect(activeTriggerRule).toMatch(/--favorite-lift:\s*-0\.32rem;/);
    expect(activeTriggerRule).toMatch(/--favorite-scale:\s*0\.995;/);
    expect(activeTriggerRule).toMatch(/rgb\(16 17 15 \/ 0\.14\)/);
    expect(activeTriggerRule).toMatch(/rgb\(16 17 15 \/ 0\.10\)/);

    expect(reducedMotion).toMatch(
      /\.favorite-card__trigger\s*\{[^}]*transition:\s*none;/,
    );
    expect(reducedMotion).toMatch(
      /\.favorite-card:hover \.favorite-card__trigger,[\s\S]*?\.favorite-card:active \.favorite-card__trigger\s*\{[^}]*transform:\s*none;/,
    );
  });

  it('keeps visual effects restrained and requires no client framework', () => {
    const source = projectFiles(projectRoot)
      .filter((file) => designSourceExtensions.has(extname(file).toLowerCase()))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });

    expect(source).not.toContain('gradient(');
    expect(source).not.toMatch(/\bfilter\s*:/);
    expect(source).not.toContain('mix-blend-mode');
    expect(source).not.toContain('h-screen');
    expect(source).not.toMatch(/client:(load|idle|visible|media|only)/);
    expect(source).not.toMatch(/scroll-snap|scroll-behavior:\s*smooth/);
    expect(dependencyNames).not.toEqual(
      expect.arrayContaining([
        'react',
        'react-dom',
        'vue',
        'svelte',
        'solid-js',
        'preact',
        'framer-motion',
        'motion',
        'gsap',
        'three',
        'rive-js',
        '@rive-app/canvas',
        'tsparticles',
        '@tsparticles/engine',
      ]),
    );
    expect(dependencyNames.some((name) => /(^three(?:-|$)|^@rive-app\/|particle)/i.test(name))).toBe(false);
  });
});
