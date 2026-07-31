import { describe, expect, it } from 'vitest';
import {
  assertFavoriteArtworkManifest,
  favoriteArtworkFor,
  tmdbImageSrcset,
  tmdbImageUrl,
  type FavoriteArtworkManifest,
  type FavoriteProviderEntry,
} from './favorite-artwork';

const entries: readonly FavoriteProviderEntry[] = [
  { translationKey: 'taxi-driver', kind: 'film', tmdbId: 103 },
  {
    translationKey: 'the-dark-side-of-the-moon',
    kind: 'album',
    spotifyUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv',
  },
];

const manifest: FavoriteArtworkManifest = {
  version: 1,
  generatedAt: '2026-07-31T00:00:00.000Z',
  items: {
    'taxi-driver': {
      provider: 'tmdb',
      providerId: 103,
      posterPath: '/poster.jpg',
      sourceUrl: 'https://www.themoviedb.org/movie/103',
    },
    'the-dark-side-of-the-moon': {
      provider: 'spotify',
      providerId: '4LH4d3cOWNNsVw41Gqt2kv',
      imageUrl: 'https://i.scdn.co/image/abc123',
      imageWidth: 640,
      imageHeight: 640,
      sourceUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv',
      embedUrl: 'https://open.spotify.com/embed/album/4LH4d3cOWNNsVw41Gqt2kv',
    },
  },
};

describe('favorite artwork providers', () => {
  it('builds TMDB image URLs and source sets', () => {
    expect(tmdbImageUrl('/poster.jpg', 'w500')).toBe(
      'https://image.tmdb.org/t/p/w500/poster.jpg',
    );
    expect(tmdbImageSrcset('/poster.jpg')).toBe(
      'https://image.tmdb.org/t/p/w342/poster.jpg 342w, https://image.tmdb.org/t/p/w500/poster.jpg 500w, https://image.tmdb.org/t/p/w780/poster.jpg 780w',
    );
  });

  it('finds artwork by translation key', () => {
    expect(favoriteArtworkFor('taxi-driver', manifest).provider).toBe('tmdb');
  });

  it.each([
    ['missing content keys', entries.slice(0, 1), manifest],
    [
      'extra manifest keys',
      entries,
      {
        ...manifest,
        items: { ...manifest.items, extra: manifest.items['taxi-driver'] },
      },
    ],
    [
      'a film backed by Spotify',
      entries,
      {
        ...manifest,
        items: {
          ...manifest.items,
          'taxi-driver': manifest.items['the-dark-side-of-the-moon'],
        },
      },
    ],
    [
      'an album backed by TMDB',
      entries,
      {
        ...manifest,
        items: {
          ...manifest.items,
          'the-dark-side-of-the-moon': manifest.items['taxi-driver'],
        },
      },
    ],
    [
      'a non-TMDB poster path',
      entries,
      {
        ...manifest,
        items: {
          ...manifest.items,
          'taxi-driver': { ...manifest.items['taxi-driver'], posterPath: '/https://example.com/poster.jpg' },
        },
      },
    ],
    [
      'a Spotify thumbnail outside i.scdn.co',
      entries,
      {
        ...manifest,
        items: {
          ...manifest.items,
          'the-dark-side-of-the-moon': {
            ...manifest.items['the-dark-side-of-the-moon'],
            imageUrl: 'https://example.com/image.jpg',
          },
        },
      },
    ],
    [
      'a Spotify source URL that differs from Markdown',
      entries,
      {
        ...manifest,
        items: {
          ...manifest.items,
          'the-dark-side-of-the-moon': {
            ...manifest.items['the-dark-side-of-the-moon'],
            sourceUrl: 'https://open.spotify.com/album/different',
          },
        },
      },
    ],
  ])('rejects %s', (_label, invalidEntries, invalidManifest) => {
    expect(() => assertFavoriteArtworkManifest(invalidEntries, invalidManifest)).toThrow();
  });

  it('accepts matching provider entries and manifest items', () => {
    expect(() => assertFavoriteArtworkManifest(entries, manifest)).not.toThrow();
  });

  it('accepts Spotify oEmbed artwork from an image-cdn spotifycdn.com host', () => {
    const spotifyCdnManifest = structuredClone(manifest);
    Object.assign(spotifyCdnManifest.items['the-dark-side-of-the-moon'], {
      imageUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02abc123',
    });

    expect(() => assertFavoriteArtworkManifest(entries, spotifyCdnManifest)).not.toThrow();
  });
});
