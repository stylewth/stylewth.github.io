export type TmdbArtwork = {
  provider: 'tmdb';
  providerId: number;
  posterPath: `/${string}`;
  sourceUrl: `https://www.themoviedb.org/movie/${string}`;
};

export type SpotifyArtwork = {
  provider: 'spotify';
  providerId: string;
  imageUrl: `https://i.scdn.co/${string}`;
  imageWidth: number;
  imageHeight: number;
  sourceUrl: `https://open.spotify.com/album/${string}`;
  embedUrl: `https://open.spotify.com/embed/album/${string}`;
};

export type FavoriteArtwork = TmdbArtwork | SpotifyArtwork;

export type FavoriteArtworkManifest = {
  version: 1;
  generatedAt: string;
  items: Record<string, FavoriteArtwork>;
};

export type FavoriteProviderEntry =
  | { translationKey: string; kind: 'film'; tmdbId: number }
  | { translationKey: string; kind: 'album'; spotifyUrl: string };

const tmdbImageBaseUrl = 'https://image.tmdb.org/t/p';
const tmdbImageSizes = ['w342', 'w500', 'w780'] as const;
const spotifyAlbumUrlPattern = /^https:\/\/open\.spotify\.com\/album\/([A-Za-z0-9]+)$/;

export function tmdbImageUrl(
  posterPath: `/${string}`,
  size: (typeof tmdbImageSizes)[number],
): string {
  return `${tmdbImageBaseUrl}/${size}${posterPath}`;
}

export function tmdbImageSrcset(posterPath: `/${string}`): string {
  return tmdbImageSizes
    .map((size) => `${tmdbImageUrl(posterPath, size)} ${size.slice(1)}w`)
    .join(', ');
}

export function favoriteArtworkFor(
  translationKey: string,
  manifest: FavoriteArtworkManifest,
): FavoriteArtwork {
  const artwork = manifest.items[translationKey];
  if (!artwork) {
    throw new Error(`Missing favorite artwork for ${translationKey}`);
  }
  return artwork;
}

export function assertFavoriteArtworkManifest(
  entries: readonly FavoriteProviderEntry[],
  manifest: FavoriteArtworkManifest,
): void {
  if (manifest.version !== 1) {
    throw new Error('Favorite artwork manifest version must be 1');
  }
  if (new Date(manifest.generatedAt).toISOString() !== manifest.generatedAt) {
    throw new Error('Favorite artwork manifest generatedAt must be an ISO timestamp');
  }

  const entryKeys = entries.map((entry) => entry.translationKey).sort();
  const manifestKeys = Object.keys(manifest.items).sort();
  if (
    entryKeys.length !== manifestKeys.length ||
    entryKeys.some((key, index) => key !== manifestKeys[index])
  ) {
    throw new Error('Favorite artwork manifest keys must exactly match content keys');
  }

  for (const entry of entries) {
    const artwork = favoriteArtworkFor(entry.translationKey, manifest);
    if (entry.kind === 'film') {
      assertTmdbArtwork(entry, artwork);
    } else {
      assertSpotifyArtwork(entry, artwork);
    }
  }
}

function assertTmdbArtwork(
  entry: Extract<FavoriteProviderEntry, { kind: 'film' }>,
  artwork: FavoriteArtwork,
): void {
  if (artwork.provider !== 'tmdb') {
    throw new Error(`${entry.translationKey} must use TMDB artwork`);
  }
  if (!Number.isInteger(artwork.providerId) || artwork.providerId !== entry.tmdbId) {
    throw new Error(`${entry.translationKey} has an invalid TMDB provider ID`);
  }
  if (!/^\/(?!\/|.*:\/\/)[^?#]+$/.test(artwork.posterPath)) {
    throw new Error(`${entry.translationKey} has an invalid TMDB poster path`);
  }
  if (artwork.sourceUrl !== `https://www.themoviedb.org/movie/${entry.tmdbId}`) {
    throw new Error(`${entry.translationKey} has an invalid TMDB source URL`);
  }
}

function assertSpotifyArtwork(
  entry: Extract<FavoriteProviderEntry, { kind: 'album' }>,
  artwork: FavoriteArtwork,
): void {
  if (artwork.provider !== 'spotify') {
    throw new Error(`${entry.translationKey} must use Spotify artwork`);
  }
  const albumMatch = spotifyAlbumUrlPattern.exec(entry.spotifyUrl);
  if (!albumMatch || artwork.providerId !== albumMatch[1]) {
    throw new Error(`${entry.translationKey} has an invalid Spotify provider ID`);
  }
  if (!/^https:\/\/i\.scdn\.co\/.+/.test(artwork.imageUrl)) {
    throw new Error(`${entry.translationKey} has an invalid Spotify image URL`);
  }
  if (!Number.isFinite(artwork.imageWidth) || artwork.imageWidth <= 0) {
    throw new Error(`${entry.translationKey} has an invalid Spotify image width`);
  }
  if (!Number.isFinite(artwork.imageHeight) || artwork.imageHeight <= 0) {
    throw new Error(`${entry.translationKey} has an invalid Spotify image height`);
  }
  if (artwork.sourceUrl !== entry.spotifyUrl) {
    throw new Error(`${entry.translationKey} has an invalid Spotify source URL`);
  }
  if (artwork.embedUrl !== `https://open.spotify.com/embed/album/${artwork.providerId}`) {
    throw new Error(`${entry.translationKey} has an invalid Spotify embed URL`);
  }
}
