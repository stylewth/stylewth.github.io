# Tenghao Wang's academic portfolio

Static Astro site for Tenghao Wang. The source of truth for public content is the Markdown under `src/content`; the generated `dist` directory is not edited by hand.

## Local development

```bash
npm install
npm run dev
npm run build
```

`npm run build` checks Astro types, unit tests, the static build, and production-output contracts. Use `npm run preview` to inspect the built site locally.

## Content maintenance

Add English Markdown records to the matching collection folder. Keep front matter complete and use a unique `translationKey`. Run the complete build before publishing.

## Photography maintenance

The Photos page is curated from the 24-row `24张策展清单.csv` in the design workspace, outside this repository. Keep IDs stable and unique (`photo-001` through `photo-024`); `order` controls display order and must remain sequential from 1 to 24. Each row points to an original by its category folder and filename. Use one of the four existing series names: `远方与尺度`, `擦肩与回望`, `城市的留白`, or `微小的回声`. Write factual `alt` text for the selected frame.

After changing the curated list or replacing an original, regenerate the public derivatives and `src/data/photography.json` with:

```bash
node scripts/prepare-photography.mjs
```

The script accepts `--source-root`, `--selection`, and `--notes` when the source folders or curation files live elsewhere. Review the generated manifest and `docs/performance/2026-10-08-photography-images.json` after regeneration. Do not edit generated JSON or derivatives by hand; the original photographs are read-only inputs.

## Project Markdown example

```md
---
title: Example project
slug: example-project
translationKey: example-project
summary: A concise public description of the work.
year: 2026
kind: research
stage: ongoing
topics: [World models, Predictive planning]
featured: false
role: Undergraduate researcher
links:
  code: https://github.com/stylewth/example-project
lang: en
---

Describe the question, approach, and public outcome here.
```

## Update Markdown example

```md
---
title: Example milestone
date: 2026-07
summary: A short, factual public update.
translationKey: example-milestone
kind: milestone
url: https://github.com/stylewth/example-project
lang: en
---
```

## Elsewhere Markdown example

```md
---
title: Example listening note
date: 2026-07-01
translationKey: example-listening-note
summary: A short note suitable for the public site.
kind: music
tags: [listening, note]
externalUrl: https://example.com
lang: en
---

The entry body can add context without changing the site structure.
```

## Favorite Markdown example

Favorites live in `src/content/favorites/film` and `src/content/favorites/album`. Keep exactly 10 films and 10 albums, with each kind ranked once from `1` through `10`. Film records identify artwork with a TMDB movie ID; album records use a canonical Spotify album URL.

Film record:

```md
---
title: Taxi Driver
translationKey: taxi-driver
kind: film
rank: 1
year: 1976
creator: Martin Scorsese
tmdbId: 103
coverAlt: 1976 US Columbia theatrical one-sheet for Taxi Driver
lang: en
---
```

Album record:

```md
---
title: The Dark Side of the Moon
translationKey: the-dark-side-of-the-moon
kind: album
rank: 1
year: 1973
creator: Pink Floyd
spotifyUrl: https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv
coverAlt: 1973 standard album cover for The Dark Side of the Moon
lang: en
---
```

The review is optional. When there is no review, omit the field entirely instead of writing an empty value.

### Refresh favorite artwork

Provider metadata is pinned in `src/data/favorite-artwork.json`, so a normal build never calls TMDB or Spotify. Refresh it only when a favorite changes:

1. Copy `.env.example` to `.env` and set `TMDB_READ_ACCESS_TOKEN` to your local TMDB read access token. Spotify oEmbed does not require a key. Never commit `.env`.
2. Edit the film `tmdbId` or album `spotifyUrl` in the relevant Markdown record.
3. Run `npm run sync:favorites`.
4. Review the complete diff in `src/data/favorite-artwork.json`; commit it only after the provider IDs, titles, years, source links, and artwork URLs are correct.
5. Run `npm run build` before publishing.

The sync command needs the TMDB token only on the maintainer's machine. Keep provider artwork unmodified and preserve the TMDB and Spotify credits rendered by the site.

## Site config and i18n

Update identity, URLs, contact details, and default metadata in the site config at `src/config/site.ts`. Public interface copy lives in `src/i18n/en.ts`. Add Chinese only as a deliberately designed second locale: introduce a `zh` content language, paired translations sharing the same `translationKey`, localized routes, and a visible language switcher before adding Chinese content. Do not mix Chinese records into the current English-only collections.

## CV gate

The public site does not publish CV files, phone numbers, GPA, passports, visas, or private records. Before adding an asset or content record, confirm it is intentionally public, needs no later removal, and contains no private contact or academic details. Do not add private-document folders to the repository.

## Future work

The future dynamic character particles and richer interactive visual experiments are intentionally deferred. They should be designed separately and must preserve the current no-client-hydration, accessible static baseline.

## Deployment

The public site is hosted at [https://stylewth.github.io/](https://stylewth.github.io/) from [stylewth/stylewth.github.io](https://github.com/stylewth/stylewth.github.io). GitHub Pages uses **GitHub Actions** as its source.

Push reviewed changes to `main` to publish. The workflow in `.github/workflows/deploy.yml` runs the complete `npm run build` checks, uploads `dist`, and deploys to GitHub Pages. It can also be started manually from the Actions tab. Check that both the build and deployment jobs succeed before sharing an update.

GitHub Pages builds only from the committed artwork manifest and photography derivatives. No TMDB or Spotify secret is required in the repository or GitHub Actions. Keep `.env` and private source documents outside the published source.
