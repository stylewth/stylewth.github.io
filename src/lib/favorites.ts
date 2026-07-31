export type FavoriteKind = 'film' | 'album';

export type FavoriteInvariantEntry = {
  id: string;
  data: {
    kind: FavoriteKind;
    lang: string;
    rank: number;
    translationKey: string;
  };
};

export type FavoriteFanPosition = {
  xRem: number;
  yRem: number;
  rotationDeg: number;
  zIndex: number;
};

export function sortFavorites<T extends FavoriteInvariantEntry>(
  entries: readonly T[],
  kind: FavoriteKind,
  lang: string,
): T[] {
  return [...entries]
    .filter((entry) => entry.data.kind === kind && entry.data.lang === lang)
    .sort((a, b) => a.data.rank - b.data.rank || a.id.localeCompare(b.id));
}

export function assertCompleteFavoriteSet(
  entries: readonly FavoriteInvariantEntry[],
  lang: string,
): void {
  const localized = entries.filter((entry) => entry.data.lang === lang);
  const translationKeys = new Set<string>();

  for (const entry of localized) {
    if (translationKeys.has(entry.data.translationKey)) {
      throw new Error(
        `Duplicate favorite translationKey "${entry.data.translationKey}" for "${lang}"`,
      );
    }
    translationKeys.add(entry.data.translationKey);
  }

  for (const kind of ['film', 'album'] as const) {
    const ranked = sortFavorites(localized, kind, lang);
    const seenRanks = new Set<number>();

    for (const entry of ranked) {
      if (seenRanks.has(entry.data.rank)) {
        throw new Error(`Duplicate ${kind} favorite rank ${entry.data.rank}`);
      }
      seenRanks.add(entry.data.rank);
    }

    const expected = Array.from({ length: 10 }, (_, index) => index + 1);
    if (ranked.length !== 10 || expected.some((rank) => !seenRanks.has(rank))) {
      throw new Error(`${kind} favorites for "${lang}" must contain ranks 1 through 10`);
    }
  }
}

export function favoriteCreatorLabel(kind: FavoriteKind): 'Director' | 'Artist' {
  return kind === 'film' ? 'Director' : 'Artist';
}

export function getFavoriteFanPosition(rank: number): FavoriteFanPosition {
  if (!Number.isInteger(rank) || rank < 1 || rank > 10) {
    throw new Error('Favorite rank must be from 1 to 10');
  }

  const offset = rank - 5.5;
  const normalizedDistance = Math.abs(offset) / 4.5;

  return {
    xRem: Number((offset * 3.9).toFixed(2)),
    yRem: Number((normalizedDistance ** 2 * 3.1).toFixed(2)),
    rotationDeg: Number((offset * (52 / 9)).toFixed(2)),
    zIndex: 10 - Math.floor(Math.abs(offset)),
  };
}
