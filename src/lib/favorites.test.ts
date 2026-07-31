import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import {
  assertCompleteFavoriteSet,
  favoriteCardModel,
  favoriteCreatorLabel,
  getFavoriteFanPosition,
  sortFavorites,
  type FavoriteInvariantEntry,
} from './favorites';
import type { FavoriteArtwork } from './favorite-artwork';

function entries(
  kind: 'film' | 'album',
  ranks: number[],
  lang = 'en',
): FavoriteInvariantEntry[] {
  return ranks.map((rank, index) => ({
    id: `${kind}-${index + 1}`,
    data: {
      kind,
      lang,
      rank,
      translationKey: `${kind}-${index + 1}`,
    },
  }));
}

describe('favorites', () => {
  const favoriteEntry = (
    kind: 'film' | 'album',
  ): CollectionEntry<'favorites'> =>
    ({
      id: `${kind}/favorite.md`,
      collection: 'favorites',
      data: {
        kind,
        title: 'Favorite',
        translationKey: 'favorite',
        rank: 1,
        year: 2000,
        creator: 'Creator',
        coverAlt: 'Favorite artwork',
        lang: 'en',
        ...(kind === 'film'
          ? { tmdbId: 103 }
          : { spotifyUrl: 'https://open.spotify.com/album/album123' }),
      },
    }) as CollectionEntry<'favorites'>;

  const tmdbArtwork: FavoriteArtwork = {
    provider: 'tmdb',
    providerId: 103,
    posterPath: '/poster.jpg',
    sourceUrl: 'https://www.themoviedb.org/movie/103',
  };

  const spotifyArtwork: FavoriteArtwork = {
    provider: 'spotify',
    providerId: 'album123',
    imageUrl: 'https://i.scdn.co/image/album123',
    imageWidth: 300,
    imageHeight: 300,
    sourceUrl: 'https://open.spotify.com/album/album123',
    embedUrl: 'https://open.spotify.com/embed/album/album123',
  };

  it('builds a TMDB card with responsive provider artwork', () => {
    expect(favoriteCardModel(favoriteEntry('film'), tmdbArtwork)).toMatchObject({
      provider: 'tmdb',
      imageSrc: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      imageSrcset:
        'https://image.tmdb.org/t/p/w342/poster.jpg 342w, https://image.tmdb.org/t/p/w500/poster.jpg 500w, https://image.tmdb.org/t/p/w780/poster.jpg 780w',
      imageWidth: 500,
      imageHeight: 750,
      sourceUrl: 'https://www.themoviedb.org/movie/103',
      providerLabel: 'TMDB',
    });
  });

  it('builds a Spotify card with the exact oEmbed image and no variants', () => {
    const card = favoriteCardModel(favoriteEntry('album'), spotifyArtwork);

    expect(card).toMatchObject({
      provider: 'spotify',
      imageSrc: 'https://i.scdn.co/image/album123',
      imageWidth: 300,
      imageHeight: 300,
      sourceUrl: 'https://open.spotify.com/album/album123',
      providerLabel: 'Spotify',
    });
    expect(card).not.toHaveProperty('imageSrcset');
  });

  it('rejects provider artwork that does not match the content kind', () => {
    expect(() => favoriteCardModel(favoriteEntry('film'), spotifyArtwork)).toThrow(
      'Film favorites must use TMDB artwork',
    );
    expect(() => favoriteCardModel(favoriteEntry('album'), tmdbArtwork)).toThrow(
      'Album favorites must use Spotify artwork',
    );
  });

  it('sorts one language and kind by rank', () => {
    const input = [
      ...entries('film', [3, 1, 2]),
      ...entries('album', [1]),
      ...entries('film', [1], 'zh'),
    ];

    expect(sortFavorites(input, 'film', 'en').map((entry) => entry.data.rank)).toEqual([
      1, 2, 3,
    ]);
  });

  it('accepts complete film and album rank sets', () => {
    expect(() =>
      assertCompleteFavoriteSet(
        [
          ...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
          ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        ],
        'en',
      ),
    ).not.toThrow();
  });

  it('rejects a missing rank', () => {
    expect(() =>
      assertCompleteFavoriteSet(
        [
          ...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
          ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        ],
        'en',
      ),
    ).toThrow('film favorites for "en" must contain ranks 1 through 10');
  });

  it('rejects duplicate ranks', () => {
    expect(() =>
      assertCompleteFavoriteSet(
        [
          ...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9, 9]),
          ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        ],
        'en',
      ),
    ).toThrow('Duplicate film favorite rank 9');
  });

  it('rejects duplicate translation keys within one language', () => {
    const input = [
      ...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    ];
    input[10].data.translationKey = input[0].data.translationKey;

    expect(() => assertCompleteFavoriteSet(input, 'en')).toThrow(
      'Duplicate favorite translationKey',
    );
  });

  it('derives creator labels from kind', () => {
    expect(favoriteCreatorLabel('film')).toBe('Director');
    expect(favoriteCreatorLabel('album')).toBe('Artist');
  });

  it('produces a symmetric shallow fan', () => {
    const first = getFavoriteFanPosition(1);
    const fifth = getFavoriteFanPosition(5);
    const sixth = getFavoriteFanPosition(6);
    const tenth = getFavoriteFanPosition(10);

    expect(first.xRem).toBe(-tenth.xRem);
    expect(first.yRem).toBe(tenth.yRem);
    expect(first.rotationDeg).toBe(-tenth.rotationDeg);
    expect(fifth.xRem).toBe(-sixth.xRem);
    expect(fifth.yRem).toBe(sixth.yRem);
    expect(first.rotationDeg).toBe(-26);
    expect(tenth.rotationDeg).toBe(26);
    expect(fifth.zIndex).toBeGreaterThan(first.zIndex);
  });

  it('rejects fan positions outside ranks 1 through 10', () => {
    expect(() => getFavoriteFanPosition(0)).toThrow('Favorite rank must be from 1 to 10');
    expect(() => getFavoriteFanPosition(11)).toThrow('Favorite rank must be from 1 to 10');
  });
});
