# Favorite Artwork Provider Design

Date: 2026-07-31

## Goal

Replace the twenty repository-owned favorite cover files with provider-backed artwork while preserving the approved shallow fan, ranked collections, native dialog, static Astro output, and no-client-framework baseline.

Films use TMDB. Albums use Spotify oEmbed. Provider data is synchronized deliberately and committed as a small manifest, so a public GitHub Pages build never needs a private credential and never depends on a live API response.

## Scope

- Add a local synchronization command for ten films and ten albums.
- Use TMDB movie IDs to resolve the canonical English poster path.
- Use public Spotify album URLs with the unauthenticated oEmbed endpoint to resolve album thumbnails and official embed URLs.
- Render responsive TMDB CDN poster URLs and Spotify oEmbed thumbnails.
- Add provider attribution and outbound source links.
- Move dialog metadata and future reviews below the artwork so provider artwork is not cropped, recolored, or overlaid.
- Remove the twenty local favorite cover files after the provider-backed output is verified.
- Document the update and deployment workflow.

This change does not add playback controls, Spotify user login, runtime API calls, analytics, monetization, or automatic scheduled synchronization.

## Content Model

Each favorite keeps the editorial fields that belong to the site:

- title
- optional original title
- translation key
- kind
- rank
- year
- creator
- cover alt text
- optional review
- language

Film records add one positive integer `tmdbId`.

Album records add one canonical `https://open.spotify.com/album/...` URL named `spotifyUrl`.

Provider image paths, dimensions, source URLs, and synchronization timestamps do not live in Markdown. They live in one generated JSON manifest keyed by `translationKey`. This separates editorial choices from provider metadata and makes manifest changes easy to inspect before publishing.

## Synchronization

`npm run sync:favorites` runs a Node script.

For films, the script:

1. Reads `TMDB_READ_ACCESS_TOKEN` from the local environment.
2. Requests TMDB movie details with `language=en-US`.
3. Verifies the returned ID, title identity, release year, and non-empty `poster_path`.
4. Stores the pinned poster path, TMDB movie URL, and synchronization metadata.

For albums, the script:

1. Validates each saved Spotify URL as a public album URL.
2. Calls `https://open.spotify.com/oembed?url=...`.
3. Verifies the provider name, title, square thumbnail dimensions, and `i.scdn.co` thumbnail host.
4. Stores the thumbnail URL, canonical album URL, embed URL, and synchronization metadata.

All twenty requests are resolved before the manifest is replaced. Any missing credential, network failure, provider error, identity mismatch, missing artwork, duplicate key, or incomplete rank set terminates the command with a clear error and leaves the existing manifest unchanged.

The script never writes the TMDB token, response headers, or raw provider responses to the repository.

## Build and Rendering

The normal Astro build reads only Markdown and the committed manifest. It performs no provider requests.

The build validates that every English favorite has exactly one matching manifest entry of the expected provider. Missing, extra, stale-keyed, or malformed entries fail the build.

TMDB posters use documented CDN sizes in `srcset` and retain the original poster aspect ratio. Spotify images use the exact oEmbed thumbnail URL at its reported dimensions and retain the original square aspect ratio. Provider images are not downloaded into `dist`, transformed by Astro, recolored, cropped, or decorated with overlaid text.

The selected dialog uses a two-part layout:

1. unmodified artwork;
2. rank, title, year, creator, review, attribution, and provider link below the artwork.

The existing shallow fan, keyboard tabs, dialog focus restoration, reduced-motion behavior, mobile horizontal scrolling, and no-JavaScript readable lists remain unchanged.

## Attribution

The Elsewhere page gains a compact Credits block after the collections:

- an approved TMDB logo;
- the exact notice: `This product uses the TMDB API but is not endorsed or certified by TMDB.`;
- a Spotify attribution mark and a link to Spotify;
- a short note that artwork and metadata are supplied by their respective providers.

Every film dialog links to its TMDB movie page. Every album dialog links to its Spotify album page. Provider marks remain less prominent than the site's identity.

The implementation follows:

- TMDB FAQ and attribution requirements: <https://developer.themoviedb.org/docs/faq>
- TMDB image URL guidance: <https://developer.themoviedb.org/docs/image-basics>
- Spotify oEmbed reference: <https://developer.spotify.com/documentation/embeds/reference/oembed>
- Spotify Developer Policy: <https://developer.spotify.com/policy>

## Credential and Repository Safety

- `.env` is ignored by Git.
- `.env.example` documents `TMDB_READ_ACCESS_TOKEN` without a value.
- The token is used only by the local synchronization command.
- GitHub Actions receives no TMDB or Spotify secret.
- No credential, raw API response, private document, or high-resolution local favorite artwork is published.

## Testing

Tests cover:

- provider-specific content schema;
- URL and response validation;
- atomic manifest generation;
- hard failures for missing credentials, mismatches, incomplete sets, and malformed provider responses;
- deterministic TMDB image URL construction;
- complete manifest-to-content matching;
- rendered provider links, responsive image markup, credits, and exact TMDB notice;
- absence of local favorite artwork references;
- artwork and caption separation;
- preservation of the existing keyboard, dialog, mobile, reduced-motion, and no-JavaScript contracts.

The final verification is `npm run build`, followed by browser inspection at desktop and mobile widths with a clean console.

## Maintenance and Deployment

To change a favorite:

1. edit its Markdown record;
2. set the correct `tmdbId` or `spotifyUrl`;
3. place the TMDB token in local `.env`;
4. run `npm run sync:favorites`;
5. review the manifest diff and provider artwork;
6. run `npm run build`;
7. commit the content and manifest together.

Before the first public deployment:

1. inspect all twenty provider links and images;
2. confirm the Credits block and exact notices are visible;
3. confirm no `.env` or local favorite artwork is tracked;
4. run the complete build and responsive browser checks;
5. enable GitHub Pages with GitHub Actions;
6. review the deployed site before sharing `https://stylewth.github.io/`.

