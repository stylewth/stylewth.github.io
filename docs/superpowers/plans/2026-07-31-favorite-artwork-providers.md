# Favorite Artwork Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local film and album covers with a pinned TMDB and Spotify oEmbed artwork manifest while preserving the approved Elsewhere interaction and static GitHub Pages build.

**Architecture:** Editorial Markdown stores a TMDB movie ID or public Spotify album URL. A local Node sync command validates provider responses and atomically commits a small JSON manifest; Astro reads only that manifest at build time, so production needs no secret or live API. The rendering layer receives a provider-neutral view model and displays unmodified remote artwork with provider credits.

**Tech Stack:** Astro 7, TypeScript 6, Node 22 built-in `fetch`, Vitest 4, `gray-matter`, TMDB API v3, Spotify oEmbed.

---

### Task 1: Define provider-aware content and manifest contracts

**Files:**
- Create: `src/lib/favorite-artwork.ts`
- Create: `src/lib/favorite-artwork.test.ts`
- Create: `src/data/favorite-artwork.json`
- Modify: `src/content.config.ts`

- [ ] **Step 1: Write failing manifest and URL tests**

Create `src/lib/favorite-artwork.test.ts` with tests that import:

```ts
import {
  assertFavoriteArtworkManifest,
  favoriteArtworkFor,
  tmdbImageSrcset,
  tmdbImageUrl,
  type FavoriteArtworkManifest,
} from './favorite-artwork';
```

Use two invariant entries, one film with `tmdbId: 103` and one album with
`spotifyUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv'`. Assert:

```ts
expect(tmdbImageUrl('/poster.jpg', 'w500')).toBe(
  'https://image.tmdb.org/t/p/w500/poster.jpg',
);
expect(tmdbImageSrcset('/poster.jpg')).toBe(
  'https://image.tmdb.org/t/p/w342/poster.jpg 342w, https://image.tmdb.org/t/p/w500/poster.jpg 500w, https://image.tmdb.org/t/p/w780/poster.jpg 780w',
);
expect(favoriteArtworkFor('taxi-driver', manifest).provider).toBe('tmdb');
```

Also assert hard failures for:

- missing content keys;
- extra manifest keys;
- a film backed by Spotify;
- an album backed by TMDB;
- a non-TMDB poster path;
- a Spotify thumbnail outside `https://i.scdn.co/`;
- a Spotify source URL that does not match the Markdown URL.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npx vitest run src/lib/favorite-artwork.test.ts
```

Expected: FAIL because `src/lib/favorite-artwork.ts` does not exist.

- [ ] **Step 3: Implement the provider-neutral contract**

Create `src/lib/favorite-artwork.ts` with these public types and functions:

```ts
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

export function tmdbImageUrl(
  posterPath: `/${string}`,
  size: 'w342' | 'w500' | 'w780',
): string;
export function tmdbImageSrcset(posterPath: `/${string}`): string;
export function favoriteArtworkFor(
  translationKey: string,
  manifest: FavoriteArtworkManifest,
): FavoriteArtwork;
export function assertFavoriteArtworkManifest(
  entries: readonly FavoriteProviderEntry[],
  manifest: FavoriteArtworkManifest,
): void;
```

Validation must compare exact translation-key sets, enforce film/TMDB and
album/Spotify pairing, compare provider IDs or URLs with Markdown, validate
`generatedAt`, and reject unknown hosts or non-positive dimensions.

- [ ] **Step 4: Change the content schema**

Replace the shared local `cover`, `coverSourceUrl`, `coverCredit`, and
`editionNote` fields with a discriminated union:

```ts
const favoriteBase = z.object({
  title: z.string().trim().min(1),
  originalTitle: z.string().trim().min(1).optional(),
  translationKey: z.string().trim().min(1),
  rank: z.number().int().min(1).max(10),
  year: z.number().int().min(1900).max(9999),
  creator: z.string().trim().min(1),
  coverAlt: z.string().trim().min(1),
  review: z.string().trim().min(1).max(180).optional(),
  lang: language,
});

const favorites = defineCollection({
  loader: glob({ base: './src/content/favorites', pattern: '**/*.{md,mdx}' }),
  schema: z.discriminatedUnion('kind', [
    favoriteBase.extend({ kind: z.literal('film'), tmdbId: z.number().int().positive() }),
    favoriteBase.extend({
      kind: z.literal('album'),
      spotifyUrl: z
        .url()
        .refine((value) => /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]+$/.test(value)),
    }),
  ]),
});
```

- [ ] **Step 5: Add a structurally valid empty manifest and verify GREEN**

Create:

```json
{
  "version": 1,
  "generatedAt": "2026-07-31T00:00:00.000Z",
  "items": {}
}
```

Run:

```powershell
npx vitest run src/lib/favorite-artwork.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit**

```powershell
git add -- src/content.config.ts src/lib/favorite-artwork.ts src/lib/favorite-artwork.test.ts src/data/favorite-artwork.json
git commit -m "feat: define favorite artwork providers"
```

### Task 2: Build the atomic provider synchronization command

**Files:**
- Create: `scripts/sync-favorite-artwork.mjs`
- Create: `src/scripts/sync-favorite-artwork.test.ts`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the front-matter parser**

Run:

```powershell
npm install --save-dev gray-matter
```

Expected: `gray-matter` appears only in `devDependencies`.

- [ ] **Step 2: Write failing synchronization tests**

Create `src/scripts/sync-favorite-artwork.test.ts`. Import:

```ts
import {
  buildFavoriteArtworkManifest,
  readFavoriteProviderEntries,
  synchronizeFavoriteArtwork,
} from '../../scripts/sync-favorite-artwork.mjs';
```

Use real temporary directories and injected `fetch` functions. Cover:

- front matter reads `tmdbId` and `spotifyUrl`;
- TMDB uses `Authorization: Bearer TOKEN` and `language=en-US`;
- Spotify calls `/oembed?url=...` without authorization;
- the produced manifest contains no token or raw response;
- wrong TMDB ID/title/year or missing `poster_path` rejects;
- wrong Spotify provider, title, dimensions, or thumbnail host rejects;
- missing token rejects before network access;
- one failed request leaves an existing target manifest byte-for-byte unchanged;
- a successful sync writes all items and replaces the target.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
npx vitest run src/scripts/sync-favorite-artwork.test.ts
```

Expected: FAIL because the synchronization module does not exist.

- [ ] **Step 4: Implement the synchronization module**

`scripts/sync-favorite-artwork.mjs` must:

```js
export function readFavoriteProviderEntries(contentRoot) {}
export async function buildFavoriteArtworkManifest(entries, options) {}
export async function synchronizeFavoriteArtwork(options) {}
```

Required behavior:

- parse all `film/*.md` and `album/*.md` through `gray-matter`;
- verify exactly ten unique ranks and keys per kind;
- fetch all provider records with `Promise.all`;
- use `https://api.themoviedb.org/3/movie/{id}?language=en-US`;
- normalize Unicode, case, punctuation, and whitespace before title comparison;
- compare the first four digits of `release_date` with Markdown year;
- use `https://open.spotify.com/oembed?url={encoded album URL}`;
- derive the Spotify ID from the album URL and the embed URL from that ID;
- sort manifest keys before JSON serialization;
- write a sibling temporary file and rename it only after every validation passes;
- remove the temporary file on failure without changing the target.

The CLI entry point reads:

```js
const token = process.env.TMDB_READ_ACCESS_TOKEN;
```

and targets `src/content/favorites` plus
`src/data/favorite-artwork.json`.

- [ ] **Step 5: Add environment and package commands**

Append `.env` to `.gitignore`, create:

```dotenv
TMDB_READ_ACCESS_TOKEN=
```

in `.env.example`, and add:

```json
"sync:favorites": "node --env-file-if-exists=.env scripts/sync-favorite-artwork.mjs"
```

- [ ] **Step 6: Run focused and unit tests**

Run:

```powershell
npx vitest run src/scripts/sync-favorite-artwork.test.ts
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```powershell
git add -- .env.example .gitignore package.json package-lock.json scripts/sync-favorite-artwork.mjs src/scripts/sync-favorite-artwork.test.ts
git commit -m "feat: sync favorite artwork providers"
```

### Task 3: Migrate the twenty favorite records and generate the manifest

**Files:**
- Modify: `src/content/favorites/film/*.md`
- Modify: `src/content/favorites/album/*.md`
- Modify: `src/data/favorite-artwork.json`

- [ ] **Step 1: Write failing content-contract assertions**

Extend `src/lib/content-schema.test.ts` and
`src/lib/favorite-artwork.test.ts` to assert:

- film entries require `tmdbId` and reject `spotifyUrl`;
- album entries require `spotifyUrl` and reject `tmdbId`;
- no favorite schema accepts `cover`, `coverSourceUrl`, `coverCredit`, or
  `editionNote`;
- all repository favorite records match one complete manifest.

Run:

```powershell
npx vitest run src/lib/content-schema.test.ts src/lib/favorite-artwork.test.ts
```

Expected: FAIL because the Markdown still uses local covers and the manifest is empty.

- [ ] **Step 2: Replace film artwork fields with exact TMDB IDs**

Use:

| translationKey | tmdbId |
|---|---:|
| taxi-driver | 103 |
| a-beautiful-mind | 453 |
| interstellar | 157336 |
| eat-drink-man-woman | 10451 |
| titanic | 597 |
| burning | 491584 |
| paprika | 4977 |
| in-the-mood-for-love | 843 |
| love-letter | 47002 |
| the-prestige | 1124 |

Keep `coverAlt`; remove the four obsolete artwork fields.

- [ ] **Step 3: Replace album artwork fields with exact Spotify URLs**

Use:

| translationKey | spotifyUrl |
|---|---|
| the-dark-side-of-the-moon | `https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv` |
| the-key | `https://open.spotify.com/album/0wWuBzOyOFxzfSPr9HSehB` |
| heisei-fuuzoku | `https://open.spotify.com/album/7jl8ThqlDTqSff9Dam29wM` |
| ok-computer | `https://open.spotify.com/album/7dxKtc08dYeRVHt3p9CZJn` |
| karuki-zahmen-kuri-no-hana | `https://open.spotify.com/album/2i4fy6a51XTaZOYA8rIdRK` |
| inside-the-cable-temple | `https://open.spotify.com/album/6ValxpcsrkQP2ugCU2Kxwy` |
| siamese-dream | `https://open.spotify.com/album/4UVERYsIzs6xbDYO8srlqd` |
| crimson | `https://open.spotify.com/album/6QOn35uhhnotiad01xwGaN` |
| selling-england-by-the-pound | `https://open.spotify.com/album/7xaM3ah9ZO4BjrcFj5vOZe` |
| good-kid-maad-city | `https://open.spotify.com/album/6PBZN8cbwkqm1ERj2BGXJ1` |

Keep `coverAlt`; remove the four obsolete artwork fields.

- [ ] **Step 4: Generate the provider manifest**

The user places the TMDB API Read Access Token in local `.env`, then run:

```powershell
npm run sync:favorites
```

Expected: twenty validated manifest items, with ten `tmdb` and ten `spotify`
entries. If the token is absent, stop and request that local credential instead
of fabricating poster paths.

- [ ] **Step 5: Verify content and manifest GREEN**

Run:

```powershell
npx vitest run src/lib/content-schema.test.ts src/lib/favorite-artwork.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit**

```powershell
git add -- src/content/favorites src/data/favorite-artwork.json src/lib/content-schema.test.ts src/lib/favorite-artwork.test.ts
git commit -m "content: migrate favorites to provider artwork"
```

### Task 4: Render provider artwork and compliant dialog details

**Files:**
- Modify: `src/lib/favorites.ts`
- Modify: `src/lib/favorites.test.ts`
- Modify: `src/pages/elsewhere/index.astro`
- Modify: `src/components/elsewhere/FavoriteFan.astro`
- Modify: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `src/scripts/favorites-stage.ts`
- Modify: `src/scripts/favorites-stage.test.ts`
- Modify: `tests/site-output.test.ts`

- [ ] **Step 1: Write failing view-model and output tests**

Add tests for a `favoriteCardModel(entry, artwork)` function. Assert:

- TMDB returns a `w500` source and `w342/w500/w780` `srcset`;
- Spotify returns the exact oEmbed image and no generated variants;
- source and provider labels are `TMDB` or `Spotify`;
- a provider mismatch throws.

Change the Elsewhere output contract to require twenty HTTPS artwork images,
ten TMDB source links, ten Spotify album links, `srcset` on ten film images,
and captions outside the dialog artwork container. Remove the assertion that
remote images are absent.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts src/scripts/favorites-stage.test.ts
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: FAIL because the page still expects Astro local image metadata.

- [ ] **Step 3: Implement the provider-neutral card model**

Add to `src/lib/favorites.ts`:

```ts
export type FavoriteCardModel = {
  entry: CollectionEntry<'favorites'>;
  provider: 'tmdb' | 'spotify';
  imageSrc: string;
  imageSrcset?: string;
  imageWidth: number;
  imageHeight: number;
  sourceUrl: string;
  providerLabel: 'TMDB' | 'Spotify';
};
```

`favoriteCardModel` uses a 2:3 intrinsic size of `500x750` for TMDB and the
reported oEmbed dimensions for Spotify.

- [ ] **Step 4: Validate and join content with the manifest**

In `src/pages/elsewhere/index.astro`, import the JSON manifest, call
`assertFavoriteArtworkManifest`, and map sorted entries through
`favoriteCardModel` before passing them to `FavoritesStage`.

- [ ] **Step 5: Replace Astro Picture with unmodified remote images**

`FavoriteFan.astro` renders:

```astro
<img
  src={favorite.imageSrc}
  srcset={favorite.imageSrcset}
  sizes="(max-width: 48rem) 8.5rem, 9.25rem"
  width={favorite.imageWidth}
  height={favorite.imageHeight}
  alt={favorite.entry.data.coverAlt}
  loading="lazy"
  referrerpolicy="no-referrer"
/>
```

Set source/provider data attributes from the card model. Do not use
`Picture`, transforms, filters, cropping, or artwork overlays.

- [ ] **Step 6: Update dialog cloning and layout**

`favorites-stage.ts` clones the trigger `img`, updates only its `sizes`, and
preserves `src`, `srcset`, dimensions, alt text, and referrer policy.

In `FavoritesStage.astro`, keep artwork and caption as separate sequential
grid rows. Remove shared-grid overlay placement and the translucent caption
background. The caption remains high-contrast on the paper background.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts src/scripts/favorites-stage.test.ts
npm run check
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: all commands pass.

- [ ] **Step 8: Commit**

```powershell
git add -- src/lib/favorites.ts src/lib/favorites.test.ts src/pages/elsewhere/index.astro src/components/elsewhere/FavoriteFan.astro src/components/elsewhere/FavoritesStage.astro src/scripts/favorites-stage.ts src/scripts/favorites-stage.test.ts tests/site-output.test.ts
git commit -m "feat: render provider-backed favorite artwork"
```

### Task 5: Add provider credits and remove local cover files

**Files:**
- Create: `public/brands/tmdb.svg`
- Create: `public/brands/spotify.svg`
- Modify: `src/i18n/en.ts`
- Modify: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `tests/source-contracts.test.ts`
- Modify: `tests/site-output.test.ts`
- Delete: `src/assets/images/favorites/films/*.jpg`
- Delete: `src/assets/images/favorites/albums/*.jpg`

- [ ] **Step 1: Write failing credit and asset-removal tests**

Require:

- the exact TMDB notice;
- approved TMDB and Spotify marks linked to their services;
- provider marks smaller than site identity;
- no tracked file under `src/assets/images/favorites`;
- no favorite output URL points to `/_astro/`.

Run:

```powershell
npx vitest run tests/source-contracts.test.ts tests/site-output.test.ts
```

Expected: FAIL because credits are missing and local covers remain.

- [ ] **Step 2: Add approved provider marks**

Download only the official, unmodified SVG marks linked from each provider's
branding or attribution documentation. Preserve aspect ratios and original
colors. Store the exact files as `public/brands/tmdb.svg` and
`public/brands/spotify.svg`; record their origin in `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 3: Render the compact Credits block**

Add the exact TMDB sentence:

```text
This product uses the TMDB API but is not endorsed or certified by TMDB.
```

Also state that album previews are supplied by Spotify, link provider names
and marks, and keep this block after the two collections and before Notes.

- [ ] **Step 4: Delete the local favorite artwork**

Resolve and verify these two exact directories are within the repository:

```text
src/assets/images/favorites/films
src/assets/images/favorites/albums
```

Delete only their twenty tracked JPEG files. The files remain recoverable from
Git history.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: all tests pass and no local favorite cover is emitted.

- [ ] **Step 6: Commit**

```powershell
git add -A -- public/brands src/assets/images/favorites src/i18n/en.ts src/components/elsewhere/FavoritesStage.astro THIRD_PARTY_NOTICES.md tests/source-contracts.test.ts tests/site-output.test.ts
git commit -m "feat: add favorite artwork attribution"
```

### Task 6: Document maintenance and deployment

**Files:**
- Modify: `README.md`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write failing documentation assertions**

Require README text for:

- `TMDB_READ_ACCESS_TOKEN`;
- `.env.example`;
- `npm run sync:favorites`;
- `tmdbId`;
- `spotifyUrl`;
- committed manifest review;
- GitHub Actions needing no provider secrets;
- TMDB and Spotify attribution checks.

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the local-cover workflow is still documented.

- [ ] **Step 3: Replace the Favorite maintenance section**

Document the exact seven-step update flow from the approved design, include
one film and one album Markdown example, explain that `.env` is local-only,
and state that public GitHub Pages builds consume the committed manifest
without calling either provider.

- [ ] **Step 4: Run and verify GREEN**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add -- README.md tests/source-contracts.test.ts
git commit -m "docs: explain provider artwork updates"
```

### Task 7: Complete verification and browser QA

**Files:**
- Modify only when a failing regression test proves a defect.

- [ ] **Step 1: Run the complete automated gate**

Run:

```powershell
npm run build
```

Expected: zero Astro diagnostics; all unit and output tests pass; seven pages
build successfully.

- [ ] **Step 2: Run repository and secret checks**

Run:

```powershell
git ls-files | rg "(^|/)\.env$|src/assets/images/favorites"
rg -n "TMDB_READ_ACCESS_TOKEN|api[_-]?key|Bearer " src public dist .github
git diff --check
git status --short
```

Expected: no tracked `.env`, local favorite art, token, API key, or Bearer
credential; no whitespace errors; only intentional changes before final
commits and a clean tree afterward.

- [ ] **Step 3: Start a fixed local production preview**

Run the preview hidden on `127.0.0.1:4321`, retain its exact PID, poll
`/elsewhere/`, and stop that exact process after QA.

- [ ] **Step 4: Perform browser QA**

At 1440x1000, 768x900, and 390x844 verify:

- all twenty covers load with no console or network errors;
- fan layout, category tabs, arrows, focus lift, dialog close paths, and focus
  restoration still work;
- film artwork is 2:3 and album artwork is square;
- captions sit below artwork and never overlay it;
- every dialog links to the correct provider;
- Credits appear between Top Tens and Notes;
- no page-level horizontal overflow;
- the mobile fan retains its own horizontal scroll;
- no review placeholder appears;
- no-JavaScript document order remains readable;
- reduced-motion behavior remains static.

- [ ] **Step 5: Fix any defect through a fresh red-green cycle**

For every defect, add the smallest failing regression test, observe the
failure, implement the minimal fix, rerun the focused test, rerun
`npm run build`, and commit the fix separately.

- [ ] **Step 6: Record completion evidence**

Record final build counts, clean console, responsive widths, provider links,
absence of secrets and local cover files, clean `git status --short`, and the
final commit list. Do not push or deploy without a separate user request.
