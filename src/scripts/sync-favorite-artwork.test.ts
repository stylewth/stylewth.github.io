import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildFavoriteArtworkManifest,
  readFavoriteProviderEntries,
  synchronizeFavoriteArtwork,
} from '../../scripts/sync-favorite-artwork.mjs';

type ProviderEntry =
  | {
      kind: 'film';
      title: string;
      originalTitle?: string;
      translationKey: string;
      rank: number;
      year: number;
      tmdbId: number;
    }
  | {
      kind: 'album';
      title: string;
      translationKey: string;
      rank: number;
      year: number;
      spotifyUrl: string;
    };

const temporaryDirectories: string[] = [];
const generatedAt = '2026-07-31T00:00:00.000Z';

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'favorite-artwork-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeFavorite(
  contentRoot: string,
  kind: 'film' | 'album',
  rank: number,
  overrides: Record<string, string | number> = {},
): void {
  const directory = join(contentRoot, kind);
  mkdirSync(directory, { recursive: true });
  const providerField =
    kind === 'film'
      ? `tmdbId: ${overrides.tmdbId ?? 100 + rank}`
      : `spotifyUrl: https://open.spotify.com/album/${overrides.spotifyId ?? `ALBUMID${rank}`}`;
  const translationKey = overrides.translationKey ?? `${kind}-${rank}`;
  const content = `---
title: ${overrides.title ?? `${kind} ${rank}`}
translationKey: ${translationKey}
kind: ${kind}
rank: ${overrides.rank ?? rank}
year: ${overrides.year ?? 2000 + rank}
${providerField}
lang: en
---
`;
  writeFileSync(join(directory, `${String(rank).padStart(2, '0')}-${translationKey}.md`), content);
}

function createCompleteContentRoot(): string {
  const contentRoot = temporaryDirectory();
  for (let rank = 1; rank <= 10; rank += 1) {
    writeFavorite(contentRoot, 'film', rank);
    writeFavorite(contentRoot, 'album', rank);
  }
  return contentRoot;
}

function filmEntry(overrides: Partial<Extract<ProviderEntry, { kind: 'film' }>> = {}) {
  return {
    kind: 'film' as const,
    title: 'Amélie!',
    originalTitle: 'Le Fabuleux Destin d’Amélie Poulain',
    translationKey: 'amelie',
    rank: 1,
    year: 2001,
    tmdbId: 194,
    ...overrides,
  };
}

function albumEntry(overrides: Partial<Extract<ProviderEntry, { kind: 'album' }>> = {}) {
  return {
    kind: 'album' as const,
    title: 'Album One',
    translationKey: 'album-one',
    rank: 1,
    year: 2001,
    spotifyUrl: 'https://open.spotify.com/album/ALBUMID1',
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function tmdbResponse(overrides: Record<string, unknown> = {}): Response {
  return jsonResponse({
    id: 194,
    title: '  AME\u0301LIE  ',
    original_title: 'Le Fabuleux Destin d Amelie Poulain',
    release_date: '2001-04-25',
    poster_path: '/amelie.jpg',
    rawOnly: 'must not be stored',
    ...overrides,
  });
}

function spotifyResponse(overrides: Record<string, unknown> = {}): Response {
  return jsonResponse({
    provider_name: 'Spotify',
    provider_url: 'https://spotify.com',
    title: ' album—one ',
    thumbnail_url: 'https://i.scdn.co/image/album-one',
    thumbnail_width: 300,
    thumbnail_height: 300,
    html: '<iframe>raw response</iframe>',
    ...overrides,
  });
}

function successfulFetch(calls: Array<{ url: string; init?: RequestInit }> = []) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push({ url, init });
    return url.startsWith('https://api.themoviedb.org/')
      ? tmdbResponse()
      : spotifyResponse();
  };
}

function completeFixtureFetch(failingUrlFragment?: string) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (failingUrlFragment && url.includes(failingUrlFragment)) {
      return jsonResponse({ error: 'provider failed' }, 503);
    }
    if (url.startsWith('https://api.themoviedb.org/')) {
      const match = url.match(/\/movie\/(\d+)\?/);
      const id = Number(match?.[1]);
      const rank = id - 100;
      expect(init?.headers).toEqual({ Authorization: 'Bearer TOKEN' });
      return jsonResponse({
        id,
        title: `film ${rank}`,
        release_date: `${2000 + rank}-01-01`,
        poster_path: `/film-${rank}.jpg`,
      });
    }
    const requestedAlbumUrl = new URL(url).searchParams.get('url');
    const id = requestedAlbumUrl?.split('/').at(-1);
    const rank = Number(id?.replace('ALBUMID', ''));
    expect(init?.headers).toBeUndefined();
    return jsonResponse({
      provider_name: 'Spotify',
      title: `album ${rank}`,
      thumbnail_url: `https://i.scdn.co/image/album-${rank}`,
      thumbnail_width: 300,
      thumbnail_height: 300,
    });
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('readFavoriteProviderEntries', () => {
  it('reads TMDB IDs and Spotify URLs from exactly ten ranked records per kind', () => {
    const entries = readFavoriteProviderEntries(createCompleteContentRoot());

    expect(entries).toHaveLength(20);
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: 'film',
        translationKey: 'film-1',
        rank: 1,
        tmdbId: 101,
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: 'album',
        translationKey: 'album-1',
        rank: 1,
        spotifyUrl: 'https://open.spotify.com/album/ALBUMID1',
      }),
    );
  });

  it('rejects incomplete rank sets', () => {
    const contentRoot = temporaryDirectory();
    for (let rank = 1; rank <= 9; rank += 1) {
      writeFavorite(contentRoot, 'film', rank);
      writeFavorite(contentRoot, 'album', rank);
    }

    expect(() => readFavoriteProviderEntries(contentRoot)).toThrow(/exactly 10/i);
  });

  it('rejects duplicate ranks in a ten-entry collection', () => {
    const contentRoot = temporaryDirectory();
    for (let rank = 1; rank <= 9; rank += 1) {
      writeFavorite(contentRoot, 'film', rank);
      writeFavorite(contentRoot, 'album', rank);
    }
    writeFavorite(contentRoot, 'film', 10, { rank: 1 });
    writeFavorite(contentRoot, 'album', 10);

    expect(() => readFavoriteProviderEntries(contentRoot)).toThrow(/duplicate rank/i);
  });

  it('rejects duplicate translation keys in a ten-entry collection', () => {
    const contentRoot = temporaryDirectory();
    for (let rank = 1; rank <= 9; rank += 1) {
      writeFavorite(contentRoot, 'film', rank);
      writeFavorite(contentRoot, 'album', rank);
    }
    writeFavorite(contentRoot, 'film', 10, { translationKey: 'film-1' });
    writeFavorite(contentRoot, 'album', 10);

    expect(() => readFavoriteProviderEntries(contentRoot)).toThrow(/duplicate translation key/i);
  });
});

describe('buildFavoriteArtworkManifest', () => {
  it('uses authenticated English TMDB requests and unauthenticated Spotify oEmbed requests', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    await buildFavoriteArtworkManifest([filmEntry(), albumEntry()], {
      token: 'TOKEN',
      fetch: successfulFetch(calls),
      generatedAt,
    });

    expect(calls).toContainEqual({
      url: 'https://api.themoviedb.org/3/movie/194?language=en-US',
      init: { headers: { Authorization: 'Bearer TOKEN' } },
    });
    expect(calls).toContainEqual({
      url: 'https://open.spotify.com/oembed?url=https%3A%2F%2Fopen.spotify.com%2Falbum%2FALBUMID1',
      init: undefined,
    });
  });

  it('builds only validated manifest fields without credentials or raw responses', async () => {
    const manifest = await buildFavoriteArtworkManifest([filmEntry(), albumEntry()], {
      token: 'TOKEN',
      fetch: successfulFetch(),
      generatedAt,
    });
    const serialized = JSON.stringify(manifest);

    expect(manifest).toEqual({
      version: 1,
      generatedAt,
      items: {
        'album-one': {
          provider: 'spotify',
          providerId: 'ALBUMID1',
          imageUrl: 'https://i.scdn.co/image/album-one',
          imageWidth: 300,
          imageHeight: 300,
          sourceUrl: 'https://open.spotify.com/album/ALBUMID1',
          embedUrl: 'https://open.spotify.com/embed/album/ALBUMID1',
        },
        amelie: {
          provider: 'tmdb',
          providerId: 194,
          posterPath: '/amelie.jpg',
          sourceUrl: 'https://www.themoviedb.org/movie/194',
        },
      },
    });
    expect(serialized).not.toContain('TOKEN');
    expect(serialized).not.toContain('rawOnly');
    expect(serialized).not.toContain('iframe');
  });

  it('accepts Spotify oEmbed artwork from an image-cdn spotifycdn.com host', async () => {
    const imageUrl =
      'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02abc123';
    const fetch = async () => spotifyResponse({ thumbnail_url: imageUrl });

    await expect(
      buildFavoriteArtworkManifest([albumEntry()], {
        token: 'TOKEN',
        fetch,
        generatedAt,
      }),
    ).resolves.toMatchObject({
      items: {
        'album-one': {
          imageUrl,
        },
      },
    });
  });

  it('starts all provider requests before awaiting their results', async () => {
    const calls: string[] = [];
    const resolvers: Array<(response: Response) => void> = [];
    const fetch = (input: string | URL | Request) => {
      calls.push(String(input));
      return new Promise<Response>((resolve) => resolvers.push(resolve));
    };

    const pending = buildFavoriteArtworkManifest([filmEntry(), albumEntry()], {
      token: 'TOKEN',
      fetch,
      generatedAt,
    });
    await Promise.resolve();

    expect(calls).toHaveLength(2);
    resolvers[0](tmdbResponse());
    resolvers[1](spotifyResponse());
    await expect(pending).resolves.toMatchObject({ version: 1 });
  });

  it.each([
    ['wrong TMDB ID', { id: 999 }, /id/i],
    ['wrong TMDB title', { title: 'Different Film', original_title: 'Different Film' }, /title/i],
    ['wrong TMDB year', { release_date: '2002-04-25' }, /year|release/i],
    ['missing TMDB poster path', { poster_path: null }, /poster/i],
  ])('rejects %s', async (_label, override, message) => {
    const fetch = async () => tmdbResponse(override);

    await expect(
      buildFavoriteArtworkManifest([filmEntry()], {
        token: 'TOKEN',
        fetch,
        generatedAt,
      }),
    ).rejects.toThrow(message);
  });

  it.each([
    ['wrong Spotify provider', { provider_name: 'Other' }, /provider/i],
    ['wrong Spotify title', { title: 'Different Album' }, /title/i],
    ['non-square Spotify dimensions', { thumbnail_width: 300, thumbnail_height: 200 }, /dimension|square/i],
    ['non-positive Spotify dimensions', { thumbnail_width: 0, thumbnail_height: 0 }, /dimension/i],
    ['wrong Spotify thumbnail host', { thumbnail_url: 'https://example.com/image.jpg' }, /thumbnail|host/i],
  ])('rejects %s', async (_label, override, message) => {
    const fetch = async () => spotifyResponse(override);

    await expect(
      buildFavoriteArtworkManifest([albumEntry()], {
        token: 'TOKEN',
        fetch,
        generatedAt,
      }),
    ).rejects.toThrow(message);
  });

  it('rejects a missing token before any network access', async () => {
    let calls = 0;
    const fetch = async () => {
      calls += 1;
      return tmdbResponse();
    };

    await expect(
      buildFavoriteArtworkManifest([filmEntry(), albumEntry()], {
        token: '',
        fetch,
        generatedAt,
      }),
    ).rejects.toThrow(/TMDB_READ_ACCESS_TOKEN/i);
    expect(calls).toBe(0);
  });
});

describe('synchronizeFavoriteArtwork', () => {
  it('leaves an existing manifest byte-for-byte unchanged and removes its temporary file on failure', async () => {
    const workspace = temporaryDirectory();
    const contentRoot = join(workspace, 'favorites');
    const sourceRoot = createCompleteContentRoot();
    mkdirSync(contentRoot, { recursive: true });
    for (const kind of ['film', 'album']) {
      mkdirSync(join(contentRoot, kind), { recursive: true });
      for (const filename of readdirSync(join(sourceRoot, kind))) {
        writeFileSync(
          join(contentRoot, kind, filename),
          readFileSync(join(sourceRoot, kind, filename)),
        );
      }
    }
    const targetPath = join(workspace, 'favorite-artwork.json');
    const existing = '{\r\n  "existing": true\r\n}\r\n';
    writeFileSync(targetPath, existing);

    await expect(
      synchronizeFavoriteArtwork({
        contentRoot,
        targetPath,
        token: 'TOKEN',
        fetch: completeFixtureFetch('ALBUMID7'),
        generatedAt,
      }),
    ).rejects.toThrow(/503/);

    expect(readFileSync(targetPath, 'utf8')).toBe(existing);
    expect(readdirSync(workspace).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('writes every item in sorted order and atomically replaces the target after a successful sync', async () => {
    const workspace = temporaryDirectory();
    const contentRoot = createCompleteContentRoot();
    const targetPath = join(workspace, 'favorite-artwork.json');
    writeFileSync(targetPath, 'old manifest');

    const manifest = await synchronizeFavoriteArtwork({
      contentRoot,
      targetPath,
      token: 'TOKEN',
      fetch: completeFixtureFetch(),
      generatedAt,
    });
    const written = readFileSync(targetPath, 'utf8');
    const parsed = JSON.parse(written);

    expect(manifest).toEqual(parsed);
    expect(Object.keys(parsed.items)).toHaveLength(20);
    expect(Object.keys(parsed.items)).toEqual([...Object.keys(parsed.items)].sort());
    expect(parsed.items['film-1']).toMatchObject({
      provider: 'tmdb',
      providerId: 101,
      posterPath: '/film-1.jpg',
    });
    expect(parsed.items['album-10']).toMatchObject({
      provider: 'spotify',
      providerId: 'ALBUMID10',
      embedUrl: 'https://open.spotify.com/embed/album/ALBUMID10',
    });
    expect(written.endsWith('\n')).toBe(true);
    expect(readdirSync(workspace).filter((name) => name.includes('.tmp'))).toEqual([]);
  });
});
