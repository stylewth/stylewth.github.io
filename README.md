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

Favorites live in `src/content/favorites/film` and `src/content/favorites/album`. Keep exactly 10 films and 10 albums, with each kind ranked once from `1` through `10`. Store each cover locally under `src/assets/images/favorites/films` or `src/assets/images/favorites/albums`; use the established `film-01-...` or `album-01-...` filename pattern and point `cover` to that local file.

```md
---
title: Taxi Driver
translationKey: taxi-driver
kind: film
rank: 1
year: 1976
creator: Martin Scorsese
cover: ../../../assets/images/favorites/films/film-01-taxi-driver-us-theatrical.jpg
coverAlt: 1976 US Columbia theatrical one-sheet for Taxi Driver
coverSourceUrl: https://www.impawards.com/1976/taxi_driver_ver1.html
coverCredit: Artwork by Guy Peellaert. Poster copyright Columbia Pictures.
editionNote: 1976 first-run US Columbia one-sheet
lang: en
---
```

The review is optional. When there is no review, omit the field entirely instead of writing an empty value. Keep `coverSourceUrl`, `coverCredit`, and `editionNote` for every favorite so the source, attribution, and edition are recorded.

Do not hotlink covers or recolor, crop, or use generated imitations of the artwork. Before public deployment, pass the artwork permission and attribution gate: a source or attribution does not equal permission to republish. Do not publicly deploy these covers without permission to do so.

## Site config and i18n

Update identity, URLs, contact details, and default metadata in the site config at `src/config/site.ts`. Public interface copy lives in `src/i18n/en.ts`. Add Chinese only as a deliberately designed second locale: introduce a `zh` content language, paired translations sharing the same `translationKey`, localized routes, and a visible language switcher before adding Chinese content. Do not mix Chinese records into the current English-only collections.

## CV gate

The public site does not publish CV files, phone numbers, GPA, passports, visas, or private records. Before adding an asset or content record, confirm it is intentionally public, needs no later removal, and contains no private contact or academic details. Do not add private-document folders to the repository.

## Future work

The future dynamic character particles and richer interactive visual experiments are intentionally deferred. They should be designed separately and must preserve the current no-client-hydration, accessible static baseline.

## GitHub Pages activation

This repository includes a deployment workflow but does not create a remote or push changes. After the repository is on GitHub, open `Settings > Pages`, set **Source** to **GitHub Actions**, and allow the workflow to run from the `main` branch. Confirm the published address is `https://stylewth.github.io/` and inspect the workflow run before sharing the site.
