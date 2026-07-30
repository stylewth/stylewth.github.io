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

## Site config and i18n

Update identity, URLs, contact details, and default metadata in the site config at `src/config/site.ts`. Public interface copy lives in `src/i18n/en.ts`. Add Chinese only as a deliberately designed second locale: introduce a `zh` content language, paired translations sharing the same `translationKey`, localized routes, and a visible language switcher before adding Chinese content. Do not mix Chinese records into the current English-only collections.

## CV gate

The public site does not publish CV files, phone numbers, GPA, passports, visas, or private records. Before adding an asset or content record, confirm it is intentionally public, needs no later removal, and contains no private contact or academic details. Do not add private-document folders to the repository.

## Future work

The future dynamic character particles and richer interactive visual experiments are intentionally deferred. They should be designed separately and must preserve the current no-client-hydration, accessible static baseline.

## GitHub Pages activation

This repository includes a deployment workflow but does not create a remote or push changes. After the repository is on GitHub, open `Settings > Pages`, set **Source** to **GitHub Actions**, and allow the workflow to run from the `main` branch. Confirm the published address is `https://stylewth.github.io/` and inspect the workflow run before sharing the site.
