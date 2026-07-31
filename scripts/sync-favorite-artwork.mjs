import { randomUUID } from 'node:crypto';
import {
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';

const SPOTIFY_ALBUM_URL = /^https:\/\/open\.spotify\.com\/album\/([A-Za-z0-9]+)$/;

function requireNonEmptyString(value, field, filename) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${filename}: ${field} must be a non-empty string`);
  }
  return value.trim();
}

function requirePositiveInteger(value, field, filename) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${filename}: ${field} must be a positive integer`);
  }
  return value;
}

function readKindEntries(contentRoot, kind) {
  const directory = join(contentRoot, kind);
  const filenames = readdirSync(directory)
    .filter((filename) => filename.endsWith('.md'))
    .sort();

  return filenames.map((filename) => {
    const path = join(directory, filename);
    const { data } = matter(readFileSync(path, 'utf8'));
    if (data.kind !== kind) {
      throw new Error(`${path}: kind must be ${kind}`);
    }

    const entry = {
      kind,
      title: requireNonEmptyString(data.title, 'title', path),
      translationKey: requireNonEmptyString(data.translationKey, 'translationKey', path),
      rank: requirePositiveInteger(data.rank, 'rank', path),
      year: requirePositiveInteger(data.year, 'year', path),
    };
    if (data.originalTitle !== undefined) {
      entry.originalTitle = requireNonEmptyString(data.originalTitle, 'originalTitle', path);
    }

    if (kind === 'film') {
      entry.tmdbId = requirePositiveInteger(data.tmdbId, 'tmdbId', path);
    } else {
      const spotifyUrl = requireNonEmptyString(data.spotifyUrl, 'spotifyUrl', path);
      if (!SPOTIFY_ALBUM_URL.test(spotifyUrl)) {
        throw new Error(`${path}: spotifyUrl must be a canonical public Spotify album URL`);
      }
      entry.spotifyUrl = spotifyUrl;
    }
    return entry;
  });
}

function assertCompleteKind(entries, kind) {
  if (entries.length !== 10) {
    throw new Error(`${kind} favorites must contain exactly 10 entries`);
  }

  const ranks = new Set();
  const keys = new Set();
  for (const entry of entries) {
    if (ranks.has(entry.rank)) {
      throw new Error(`${kind} favorites contain duplicate rank ${entry.rank}`);
    }
    if (keys.has(entry.translationKey)) {
      throw new Error(`${kind} favorites contain duplicate translation key ${entry.translationKey}`);
    }
    ranks.add(entry.rank);
    keys.add(entry.translationKey);
  }

  for (let rank = 1; rank <= 10; rank += 1) {
    if (!ranks.has(rank)) {
      throw new Error(`${kind} favorites must contain every rank from 1 through 10`);
    }
  }
}

export function readFavoriteProviderEntries(contentRoot) {
  const films = readKindEntries(contentRoot, 'film');
  const albums = readKindEntries(contentRoot, 'album');
  assertCompleteKind(films, 'film');
  assertCompleteKind(albums, 'album');

  const allKeys = new Set();
  for (const entry of [...films, ...albums]) {
    if (allKeys.has(entry.translationKey)) {
      throw new Error(`favorites contain duplicate translation key ${entry.translationKey}`);
    }
    allKeys.add(entry.translationKey);
  }
  return [...films, ...albums];
}

function normalizedTitle(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}+/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[\p{P}\p{S}\s]+/gu, '');
}

function assertMatchingTitle(entry, providerTitles, provider) {
  const expected = [entry.title, entry.originalTitle]
    .filter((title) => typeof title === 'string')
    .map(normalizedTitle);
  const actual = providerTitles
    .filter((title) => typeof title === 'string' && title.trim() !== '')
    .map(normalizedTitle);
  if (!actual.some((title) => expected.includes(title))) {
    throw new Error(`${provider} title does not match ${entry.translationKey}`);
  }
}

async function fetchJson(fetchImplementation, url, init, provider) {
  const response = await fetchImplementation(url, init);
  if (!response || typeof response.ok !== 'boolean') {
    throw new Error(`${provider} returned an invalid response`);
  }
  if (!response.ok) {
    throw new Error(`${provider} request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchTmdbArtwork(entry, options) {
  const url = `https://api.themoviedb.org/3/movie/${entry.tmdbId}?language=en-US`;
  const data = await fetchJson(
    options.fetch,
    url,
    { headers: { Authorization: `Bearer ${options.token}` } },
    'TMDB',
  );

  if (data.id !== entry.tmdbId) {
    throw new Error(`TMDB ID does not match ${entry.translationKey}`);
  }
  assertMatchingTitle(entry, [data.title, data.original_title], 'TMDB');
  const releaseYear =
    typeof data.release_date === 'string' ? data.release_date.match(/^(\d{4})/)?.[1] : undefined;
  if (releaseYear !== String(entry.year)) {
    throw new Error(`TMDB release year does not match ${entry.translationKey}`);
  }
  if (
    typeof data.poster_path !== 'string' ||
    !/^\/(?!\/)\S+$/.test(data.poster_path)
  ) {
    throw new Error(`TMDB poster path is missing or invalid for ${entry.translationKey}`);
  }

  return [
    entry.translationKey,
    {
      provider: 'tmdb',
      providerId: entry.tmdbId,
      posterPath: data.poster_path,
      sourceUrl: `https://www.themoviedb.org/movie/${entry.tmdbId}`,
    },
  ];
}

async function fetchSpotifyArtwork(entry, options) {
  const albumMatch = entry.spotifyUrl.match(SPOTIFY_ALBUM_URL);
  if (!albumMatch) {
    throw new Error(`Spotify URL is invalid for ${entry.translationKey}`);
  }
  const providerId = albumMatch[1];
  const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(entry.spotifyUrl)}`;
  const data = await fetchJson(options.fetch, url, undefined, 'Spotify');

  if (data.provider_name !== 'Spotify') {
    throw new Error(`Spotify provider is invalid for ${entry.translationKey}`);
  }
  assertMatchingTitle(entry, [data.title], 'Spotify');
  if (
    !Number.isInteger(data.thumbnail_width) ||
    !Number.isInteger(data.thumbnail_height) ||
    data.thumbnail_width <= 0 ||
    data.thumbnail_height <= 0 ||
    data.thumbnail_width !== data.thumbnail_height
  ) {
    throw new Error(`Spotify thumbnail dimensions must be positive and square for ${entry.translationKey}`);
  }

  let thumbnail;
  try {
    thumbnail = new URL(data.thumbnail_url);
  } catch {
    throw new Error(`Spotify thumbnail URL is invalid for ${entry.translationKey}`);
  }
  if (
    thumbnail.protocol !== 'https:' ||
    thumbnail.hostname !== 'i.scdn.co' ||
    thumbnail.pathname === '/'
  ) {
    throw new Error(`Spotify thumbnail host is invalid for ${entry.translationKey}`);
  }

  return [
    entry.translationKey,
    {
      provider: 'spotify',
      providerId,
      imageUrl: thumbnail.href,
      imageWidth: data.thumbnail_width,
      imageHeight: data.thumbnail_height,
      sourceUrl: entry.spotifyUrl,
      embedUrl: `https://open.spotify.com/embed/album/${providerId}`,
    },
  ];
}

export async function buildFavoriteArtworkManifest(entries, options) {
  if (typeof options?.token !== 'string' || options.token.trim() === '') {
    throw new Error('TMDB_READ_ACCESS_TOKEN is required');
  }
  if (typeof options.fetch !== 'function') {
    throw new Error('A fetch implementation is required');
  }

  const keys = new Set();
  for (const entry of entries) {
    if (keys.has(entry.translationKey)) {
      throw new Error(`favorites contain duplicate translation key ${entry.translationKey}`);
    }
    keys.add(entry.translationKey);
  }

  const resolved = await Promise.all(
    entries.map((entry) => {
      if (entry.kind === 'film') {
        return fetchTmdbArtwork(entry, options);
      }
      if (entry.kind === 'album') {
        return fetchSpotifyArtwork(entry, options);
      }
      throw new Error(`unsupported favorite kind ${entry.kind}`);
    }),
  );
  resolved.sort(([left], [right]) => left.localeCompare(right, 'en'));

  return {
    version: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    items: Object.fromEntries(resolved),
  };
}

export async function synchronizeFavoriteArtwork(options) {
  const entries = readFavoriteProviderEntries(options.contentRoot);
  const manifest = await buildFavoriteArtworkManifest(entries, options);
  const targetDirectory = dirname(options.targetPath);
  const temporaryPath = join(
    targetDirectory,
    `.${basename(options.targetPath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    renameSync(temporaryPath, options.targetPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
  return manifest;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  await synchronizeFavoriteArtwork({
    contentRoot: join(repositoryRoot, 'src', 'content', 'favorites'),
    targetPath: join(repositoryRoot, 'src', 'data', 'favorite-artwork.json'),
    token: process.env.TMDB_READ_ACCESS_TOKEN,
    fetch: globalThis.fetch,
  });
}
