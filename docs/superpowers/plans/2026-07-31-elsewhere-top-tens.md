# Elsewhere Top Tens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers-plus:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add maintainable Movie and Album Top 10 collections to `/elsewhere/` as a shallow overlapping fan with accessible category tabs and a click-to-enlarge focus card.

**Architecture:** Add a typed `favorites` content collection and keep it separate from dated Elsewhere notes. The Astro page renders both semantic ordered lists as the no-JavaScript baseline, while an isolated custom element progressively enhances them into a shared tabbed fan and native dialog. Local responsive cover assets pass through Astro's image pipeline; no runtime API or client framework is added.

**Tech Stack:** Astro 7, TypeScript, content collections, scoped native CSS, a small custom element, Vitest, Happy DOM as a development-only DOM test environment.

---

## Working constraints

- Work in the existing checkout on `main`. The repository instructions explicitly prohibit creating a worktree without separate approval, and the user explicitly authorized implementation in the current task.
- Use `apply_patch` for text edits. Binary cover downloads are the only file-write exception.
- Follow strict red-green-refactor: every production behavior begins with a test that is run and observed failing for the expected reason.
- Do not push, deploy, or create a remote repository.
- Do not publish the cover gallery until every asset has a traceable exact-edition source and any attribution requirement is met.
- This iteration is a local implementation preview, not a publication-ready
  release. The catalogued Hong Kong Style B identification for film rank 8 is
  sufficient for local visual development but remains an explicit deployment
  blocker until a first-party archive confirms it.

## Design read and preservation audit

Reading this as: a targeted evolution of an academic portfolio for advisors and peers, with a restrained editorial collector's-archive language, using the site's existing native Astro/CSS system.

- `DESIGN_VARIANCE: 6`: one distinctive shallow fan, while the rest of the page keeps the current editorial grid.
- `MOTION_INTENSITY: 4`: short CSS state transitions only; no physics, autoplay, or scroll choreography.
- `VISUAL_DENSITY: 3`: one collection stage at a time with generous white space.
- Preserve: `/elsewhere/`, navigation labels, Newsreader + DM Sans, white theme, warm-neutral rules, sharp corners, current note copy, and existing accessibility contracts.
- Add one local accent: restrained warm red, used only for the active collection state and focus details.
- Real standard-release covers are required. Generated artwork and CSS fake covers are not allowed.
- New visible copy contains no em dash or en dash characters.

## File map

| File | Responsibility |
|---|---|
| `src/content.config.ts` | Define and validate one favorite record |
| `src/lib/favorites.ts` | Sort favorites, validate complete rank sets, derive labels, and calculate deterministic fan positions |
| `src/lib/favorites.test.ts` | Unit-test favorite invariants and fan geometry |
| `src/content/favorites/film/*.md` | Ten ranked film records |
| `src/content/favorites/album/*.md` | Ten ranked album records |
| `src/assets/images/favorites/films/*` | Local standard theatrical posters |
| `src/assets/images/favorites/albums/*` | Local standard album covers |
| `src/components/elsewhere/FavoriteFan.astro` | Render one semantic ordered list and its visual fan |
| `src/components/elsewhere/FavoritesStage.astro` | Render tabs, panels, and the shared focus dialog |
| `src/scripts/favorites-stage.ts` | Own progressive enhancement, tabs, and dialog state |
| `src/scripts/favorites-stage.test.ts` | Exercise interaction behavior in Happy DOM |
| `src/pages/elsewhere/index.astro` | Query, validate, and compose favorites before existing notes |
| `src/i18n/en.ts` | Store reusable English UI labels |
| `tests/source-contracts.test.ts` | Enforce source, asset, content, and design constraints |
| `tests/site-output.test.ts` | Verify built semantic output and route-local script policy |
| `README.md` | Document favorite maintenance and the cover publication gate |

### Task 1: Add the favorite domain model and content schema

**Files:**
- Create: `src/lib/favorites.test.ts`
- Create: `src/lib/favorites.ts`
- Modify: `src/content.config.ts`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write failing unit tests for sorting, rank completeness, labels, and geometry**

Create `src/lib/favorites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  assertCompleteFavoriteSet,
  favoriteCreatorLabel,
  getFavoriteFanPosition,
  sortFavorites,
  type FavoriteInvariantEntry,
} from './favorites';

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
        [...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
         ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
        'en',
      ),
    ).not.toThrow();
  });

  it('rejects a missing rank', () => {
    expect(() =>
      assertCompleteFavoriteSet(
        [...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
         ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
        'en',
      ),
    ).toThrow('film favorites for "en" must contain ranks 1 through 10');
  });

  it('rejects duplicate ranks', () => {
    expect(() =>
      assertCompleteFavoriteSet(
        [...entries('film', [1, 2, 3, 4, 5, 6, 7, 8, 9, 9]),
         ...entries('album', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
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
```

- [ ] **Step 2: Run the unit test and verify RED**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts
```

Expected: FAIL because `src/lib/favorites.ts` does not exist.

- [ ] **Step 3: Implement the minimal favorite domain module**

Create `src/lib/favorites.ts`:

```ts
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
    if (
      ranked.length !== 10 ||
      expected.some((rank) => !seenRanks.has(rank))
    ) {
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
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Add a failing source-contract test for the collection schema**

Append inside `describe('public source contracts', ...)` in `tests/source-contracts.test.ts`:

```ts
  it('defines strict favorite records without runtime metadata fetching', () => {
    const contentConfig = readFileSync(
      join(projectRoot, 'src', 'content.config.ts'),
      'utf8',
    );

    expect(contentConfig).toContain('const favorites = defineCollection');
    expect(contentConfig).toContain("kind: z.enum(['film', 'album'])");
    expect(contentConfig).toMatch(/rank:\s*z\.number\(\)\.int\(\)\.min\(1\)\.max\(10\)/);
    expect(contentConfig).toMatch(/year:\s*z\.number\(\)\.int\(\)\.min\(1900\)\.max\(9999\)/);
    expect(contentConfig).toContain('cover: image()');
    expect(contentConfig).toContain('coverSourceUrl: z.url()');
    expect(contentConfig).toContain('editionNote: z.string().trim().min(1)');
    expect(contentConfig).toMatch(
      /review:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(180\)\.optional\(\)/,
    );
    expect(contentConfig).toMatch(/export const collections = \{[\s\S]*favorites/);
  });
```

- [ ] **Step 6: Run the source-contract test and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because `favorites` is not defined in `src/content.config.ts`.

- [ ] **Step 7: Add the content collection**

Insert before the exports in `src/content.config.ts`:

```ts
const favorites = defineCollection({
  loader: glob({ base: './src/content/favorites', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      originalTitle: z.string().trim().min(1).optional(),
      translationKey: z.string().trim().min(1),
      kind: z.enum(['film', 'album']),
      rank: z.number().int().min(1).max(10),
      year: z.number().int().min(1900).max(9999),
      creator: z.string().trim().min(1),
      cover: image(),
      coverAlt: z.string().trim().min(1),
      coverSourceUrl: z.url(),
      coverCredit: z.string().trim().min(1).optional(),
      editionNote: z.string().trim().min(1),
      review: z.string().trim().min(1).max(180).optional(),
      lang: language,
    }),
});
```

Change the export to:

```ts
export const collections = {
  projects,
  updates,
  elsewhere,
  favorites,
};
```

- [ ] **Step 8: Run schema and unit verification**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts tests/source-contracts.test.ts
npm run check
```

Expected: all selected tests pass and Astro check reports zero errors, warnings, or hints.

- [ ] **Step 9: Commit**

```powershell
git add -- src/lib/favorites.ts src/lib/favorites.test.ts src/content.config.ts tests/source-contracts.test.ts
git commit -m "feat: define ranked favorite content"
```

### Task 2: Add the 20 sourced records and local release covers

**Files:**
- Create: `src/content/favorites/film/*.md`
- Create: `src/content/favorites/album/*.md`
- Create: `src/assets/images/favorites/films/*`
- Create: `src/assets/images/favorites/albums/*`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write failing source tests for exact records and assets**

Add these constants near the top of `tests/source-contracts.test.ts`:

```ts
type ApprovedFavorite = readonly [
  file: string,
  rank: number,
  title: string,
  year: number,
  creator: string,
  coverFile: string,
  sourceUrl: string,
];

const approvedFilmRecords: ApprovedFavorite[] = [
  ['01-taxi-driver.md', 1, 'Taxi Driver', 1976, 'Martin Scorsese', 'film-01-taxi-driver-us-theatrical.jpg', 'https://www.impawards.com/1976/taxi_driver_ver1.html'],
  ['02-a-beautiful-mind.md', 2, 'A Beautiful Mind', 2001, 'Ron Howard', 'film-02-a-beautiful-mind-us-theatrical.jpg', 'https://www.impawards.com/2001/beautiful_mind.html'],
  ['03-interstellar.md', 3, 'Interstellar', 2014, 'Christopher Nolan', 'film-03-interstellar-us-theatrical.jpg', 'https://www.impawards.com/2014/interstellar.html'],
  ['04-eat-drink-man-woman.md', 4, 'Eat Drink Man Woman', 1994, 'Ang Lee', 'film-04-eat-drink-man-woman-tw-theatrical.jpg', 'https://collections.nmth.gov.tw/CollectionContent.aspx?a=132&rno=2010.019.1068'],
  ['05-titanic.md', 5, 'Titanic', 1997, 'James Cameron', 'film-05-titanic-us-theatrical.jpg', 'https://www.impawards.com/1997/titanic_ver2.html'],
  ['06-burning.md', 6, 'Burning', 2018, 'Lee Chang-dong', 'film-06-burning-kr-theatrical.jpg', 'https://www.koreanfilm.or.kr/eng/films/index/filmsView.jsp?category=ALL&mode=INDEX_FILMS_LIST&movieCd=20173202&pageIndex=1&pageRowSize=10&peopleCd=&s_genre=ALL&searchKeyword=Lee+Chang-dong&searchType=DIRECTOR&strMenuId=010401&userId='],
  ['07-paprika.md', 7, 'Paprika', 2006, 'Satoshi Kon', 'film-07-paprika-jp-theatrical.jpg', 'https://www.sonypictures.jp/he/815804'],
  ['08-in-the-mood-for-love.md', 8, 'In the Mood for Love', 2000, 'Wong Kar-wai', 'film-08-in-the-mood-for-love-hk-theatrical.jpg', 'https://posteritati.com/poster/14327/in-the-mood-for-love-original-2000-hong-kong-b1-movie-poster'],
  ['09-love-letter.md', 9, 'Love Letter', 1995, 'Shunji Iwai', 'film-09-love-letter-jp-theatrical.jpg', 'https://cineswitch.com/movie_detail/love-letter'],
  ['10-the-prestige.md', 10, 'The Prestige', 2006, 'Christopher Nolan', 'film-10-the-prestige-us-theatrical.jpg', 'https://www.impawards.com/2006/prestige.html'],
];

const approvedAlbumRecords: ApprovedFavorite[] = [
  ['01-the-dark-side-of-the-moon.md', 1, 'The Dark Side of the Moon', 1973, 'Pink Floyd', 'album-01-the-dark-side-of-the-moon.jpg', 'https://musicbrainz.org/release/b84ee12a-09ef-421b-82de-0441a926375b/cover-art'],
  ['02-the-key.md', 2, 'The Key', 2013, 'Eason Chan', 'album-02-the-key.jpg', 'https://music.apple.com/us/album/the-key/1386714588'],
  ['03-heisei-fuuzoku.md', 3, 'Heisei Fuuzoku - Japanese Manners', 2007, 'Sheena Ringo × Neko Saito', 'album-03-heisei-fuuzoku.jpg', 'https://music.apple.com/us/album/heisei-fuuzoku-japanese-manners/1384785330'],
  ['04-ok-computer.md', 4, 'OK Computer', 1997, 'Radiohead', 'album-04-ok-computer.jpg', 'https://musicbrainz.org/release/425d8db9-88a3-31e2-bd23-b1a967626dd5/cover-art'],
  ['05-karuki-zahmen-kuri-no-hana.md', 5, 'Karuki Zahmen Kuri No Hana - Kalk Samen Chestnut Flower', 2003, 'Sheena Ringo', 'album-05-karuki-zahmen-kuri-no-hana.jpg', 'https://music.apple.com/jp/album/karuki-zahmen-kuri-no-hana-kalk-samen-chestnut-flower/1385320232'],
  ['06-inside-the-cable-temple.md', 6, 'Inside the Cable Temple', 2020, 'Omnipotent Youth Society', 'album-06-inside-the-cable-temple.jpg', 'https://music.apple.com/tw/album/%E5%86%80%E8%A5%BF%E5%8D%97%E6%9E%97%E8%B7%AF%E8%A1%8C/1545534900'],
  ['07-siamese-dream.md', 7, 'Siamese Dream', 1993, 'The Smashing Pumpkins', 'album-07-siamese-dream.jpg', 'https://musicbrainz.org/release/8d967bcd-02e3-380f-8e0d-2f3cfb79561d/cover-art'],
  ['08-crimson.md', 8, 'CRIMSON', 1986, 'Akina Nakamori', 'album-08-crimson.jpg', 'https://music.apple.com/jp/album/crimson/903270513'],
  ['09-selling-england-by-the-pound.md', 9, 'Selling England by the Pound', 1973, 'Genesis', 'album-09-selling-england-by-the-pound.jpg', 'https://musicbrainz.org/release/b20fe9b2-ffdb-4765-8d1b-60e4c91577eb/cover-art'],
  ['10-good-kid-maad-city.md', 10, 'good kid, m.A.A.d city', 2012, 'Kendrick Lamar', 'album-10-good-kid-maad-city.jpg', 'https://musicbrainz.org/release/5d850f71-e51e-44be-96c8-51cc305f3596/cover-art'],
];
```

Add this test:

```ts
  it('contains the approved Top 10 films and albums with local covers', () => {
    const filmRoot = join(contentRoot, 'favorites', 'film');
    const albumRoot = join(contentRoot, 'favorites', 'album');
    const films = readdirSync(filmRoot).filter((file) => file.endsWith('.md')).sort();
    const albums = readdirSync(albumRoot).filter((file) => file.endsWith('.md')).sort();
    const approvedRecords = [
      ...approvedFilmRecords.map((record) => ['film', filmRoot, record] as const),
      ...approvedAlbumRecords.map((record) => ['album', albumRoot, record] as const),
    ];
    const favoriteImages = projectFiles(
      join(projectRoot, 'src', 'assets', 'images', 'favorites'),
    ).filter((file) => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(file).toLowerCase()));

    expect(films).toEqual(approvedFilmRecords.map(([file]) => file));
    expect(albums).toEqual(approvedAlbumRecords.map(([file]) => file));
    expect(favoriteImages.map((file) => file.split(/[\\/]/).at(-1)).sort()).toEqual(
      approvedRecords.map(([, , [, , , , , coverFile]]) => coverFile).sort(),
    );

    approvedRecords.forEach(([kind, root, record]) => {
      const [file, rank, title, year, creator, coverFile, sourceUrl] = record;
      const content = readFileSync(join(root, file), 'utf8');
      expect(content).toContain(`title: ${title}`);
      expect(content).toContain(`kind: ${kind}`);
      expect(content).toContain(`rank: ${rank}`);
      expect(content).toContain(`year: ${year}`);
      expect(content).toContain(`creator: ${creator}`);
      expect(content).toContain(
        `cover: ../../../assets/images/favorites/${kind === 'film' ? 'films' : 'albums'}/${coverFile}`,
      );
      expect(content).toContain(`coverSourceUrl: ${sourceUrl}`);
      expect(content).toMatch(/^coverCredit:\s+\S/m);
      expect(content).toMatch(/editionNote:\s+\S/);
      expect(content).not.toMatch(/^review:/m);
      expect(content).not.toContain('.invalid');
    });
  });
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the favorite directories and records do not exist.

- [ ] **Step 3: Acquire exact standard-release covers**

Create:

```text
src/assets/images/favorites/films/
src/assets/images/favorites/albums/
```

Use the exact asset manifest in the final section of this plan. For every asset:

1. open the listed source page and confirm the displayed edition;
2. download the listed direct image without applying a filter, crop, color conversion, or AI reconstruction;
3. save it under the exact production filename;
4. inspect the local file visually;
5. record the source page and edition note in its Markdown record.

If a listed image has disappeared or no longer matches the documented edition, stop this task and report that exact item. Do not silently substitute another territory, remaster, deluxe edition, or generated lookalike.

- [ ] **Step 4: Add exact film records**

Create one Markdown file per row:

| File | `title` | `originalTitle` | `rank` | `year` | `creator` | `cover` | `editionNote` |
|---|---|---|---:|---:|---|---|---|
| `01-taxi-driver.md` | `Taxi Driver` | omit | 1 | 1976 | `Martin Scorsese` | `../../../assets/images/favorites/films/film-01-taxi-driver-us-theatrical.jpg` | `1976 first-run US Columbia one-sheet` |
| `02-a-beautiful-mind.md` | `A Beautiful Mind` | omit | 2 | 2001 | `Ron Howard` | `../../../assets/images/favorites/films/film-02-a-beautiful-mind-us-theatrical.jpg` | `2001 first-run US main theatrical one-sheet` |
| `03-interstellar.md` | `Interstellar` | omit | 3 | 2014 | `Christopher Nolan` | `../../../assets/images/favorites/films/film-03-interstellar-us-theatrical.jpg` | `2014 US theatrical teaser one-sheet with star-field title art` |
| `04-eat-drink-man-woman.md` | `Eat Drink Man Woman` | `飲食男女` | 4 | 1994 | `Ang Lee` | `../../../assets/images/favorites/films/film-04-eat-drink-man-woman-tw-theatrical.jpg` | `1994 first-run Taiwan theatrical poster` |
| `05-titanic.md` | `Titanic` | omit | 5 | 1997 | `James Cameron` | `../../../assets/images/favorites/films/film-05-titanic-us-theatrical.jpg` | `1997 first-run US main theatrical one-sheet` |
| `06-burning.md` | `Burning` | `버닝` | 6 | 2018 | `Lee Chang-dong` | `../../../assets/images/favorites/films/film-06-burning-kr-theatrical.jpg` | `2018 first-run South Korea main theatrical poster` |
| `07-paprika.md` | `Paprika` | `パプリカ` | 7 | 2006 | `Satoshi Kon` | `../../../assets/images/favorites/films/film-07-paprika-jp-theatrical.jpg` | `2006 Japan first-release theatrical one-sheet, standard B2 artwork` |
| `08-in-the-mood-for-love.md` | `In the Mood for Love` | `花樣年華` | 8 | 2000 | `Wong Kar-wai` | `../../../assets/images/favorites/films/film-08-in-the-mood-for-love-hk-theatrical.jpg` | `2000 Hong Kong original-release B1 poster, Style B; catalogue cross-check pending` |
| `09-love-letter.md` | `Love Letter` | omit | 9 | 1995 | `Shunji Iwai` | `../../../assets/images/favorites/films/film-09-love-letter-jp-theatrical.jpg` | `Original 1995 Japanese theatrical B2 poster, 515 × 728 mm` |
| `10-the-prestige.md` | `The Prestige` | omit | 10 | 2006 | `Christopher Nolan` | `../../../assets/images/favorites/films/film-10-the-prestige-us-theatrical.jpg` | `2006 first-run US main theatrical one-sheet` |

Each file uses this complete shape, substituting the table values plus the
manifest source URL and compact credit:

```yaml
---
title: Taxi Driver
translationKey: taxi-driver
kind: film
rank: 1
year: 1976
creator: Martin Scorsese
cover: ../../../assets/images/favorites/films/film-01-taxi-driver-us-theatrical.jpg
coverAlt: Original theatrical poster for Taxi Driver
coverSourceUrl: https://www.impawards.com/1976/taxi_driver_ver1.html
coverCredit: Artwork by Guy Peellaert. Poster copyright Columbia Pictures.
editionNote: 1976 first-run US Columbia one-sheet
lang: en
---
```

Add `originalTitle` only for the four rows that specify it. Do not add `review`.

- [ ] **Step 5: Add exact album records**

Create one Markdown file per row:

| File | `title` | `originalTitle` | `rank` | `year` | `creator` | `cover` | `editionNote` |
|---|---|---|---:|---:|---|---|---|
| `01-the-dark-side-of-the-moon.md` | `The Dark Side of the Moon` | omit | 1 | 1973 | `Pink Floyd` | `../../../assets/images/favorites/albums/album-01-the-dark-side-of-the-moon.jpg` | `1973 UK standard LP, Harvest SHVL 804` |
| `02-the-key.md` | `The Key` | omit | 2 | 2013 | `Eason Chan` | `../../../assets/images/favorites/albums/album-02-the-key.jpg` | `2013 Hong Kong standard 8-track album` |
| `03-heisei-fuuzoku.md` | `Heisei Fuuzoku - Japanese Manners` | `平成風俗` | 3 | 2007 | `Sheena Ringo × Neko Saito` | `../../../assets/images/favorites/albums/album-03-heisei-fuuzoku.jpg` | `2007 Japan regular CD, TOCT-26210` |
| `04-ok-computer.md` | `OK Computer` | omit | 4 | 1997 | `Radiohead` | `../../../assets/images/favorites/albums/album-04-ok-computer.jpg` | `1997 UK and Europe standard 12-track CD, CDNODATA 02` |
| `05-karuki-zahmen-kuri-no-hana.md` | `Karuki Zahmen Kuri No Hana - Kalk Samen Chestnut Flower` | `加爾基 精液 栗ノ花` | 5 | 2003 | `Sheena Ringo` | `../../../assets/images/favorites/albums/album-05-karuki-zahmen-kuri-no-hana.jpg` | `2003 Japan original Copy Control CD, TOCT-24942` |
| `06-inside-the-cable-temple.md` | `Inside the Cable Temple` | `冀西南林路行` | 6 | 2020 | `Omnipotent Youth Society` | `../../../assets/images/favorites/albums/album-06-inside-the-cable-temple.jpg` | `2020 original standard 8-track digital release` |
| `07-siamese-dream.md` | `Siamese Dream` | omit | 7 | 1993 | `The Smashing Pumpkins` | `../../../assets/images/favorites/albums/album-07-siamese-dream.jpg` | `1993 original US standard CD, 0777 7 88267 2 9` |
| `08-crimson.md` | `CRIMSON` | omit | 8 | 1986 | `Akina Nakamori` | `../../../assets/images/favorites/albums/album-08-crimson.jpg` | `1986 original 10-track album` |
| `09-selling-england-by-the-pound.md` | `Selling England by the Pound` | omit | 9 | 1973 | `Genesis` | `../../../assets/images/favorites/albums/album-09-selling-england-by-the-pound.jpg` | `1973 original UK LP, Charisma CAS 1074` |
| `10-good-kid-maad-city.md` | `good kid, m.A.A.d city` | omit | 10 | 2012 | `Kendrick Lamar` | `../../../assets/images/favorites/albums/album-10-good-kid-maad-city.jpg` | `2012 original US standard 12-track CD, B0017534-02` |

Use the same complete frontmatter shape as the film records with `kind: album`,
the row's `translationKey`, cover alt text, manifest `coverSourceUrl`, compact
manifest `coverCredit`, and no `review`.

- [ ] **Step 6: Run the exact content checks**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts tests/source-contracts.test.ts
npm run check
```

Expected: all selected tests pass; Astro validates all 20 cover imports and reports zero errors, warnings, or hints.

- [ ] **Step 7: Commit**

```powershell
git add -- src/content/favorites src/assets/images/favorites tests/source-contracts.test.ts
git commit -m "content: add film and album top tens"
```

### Task 3: Render the semantic collection stage and no-JavaScript fallback

**Files:**
- Create: `src/components/elsewhere/FavoriteFan.astro`
- Create: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `src/pages/elsewhere/index.astro`
- Modify: `src/i18n/en.ts`
- Modify: `tests/site-output.test.ts`

- [ ] **Step 1: Write failing built-output tests**

Replace the existing Elsewhere archive test in `tests/site-output.test.ts` with:

```ts
  it('publishes Top 10 collections before the existing Notes archive', () => {
    const elsewhere = readOutput('elsewhere/index.html');

    expectDocumentShell(elsewhere, '/elsewhere/', 'Elsewhere | Tenghao Wang');
    expect(elsewhere).toContain('<favorites-stage');
    expect(elsewhere.match(/<ol[^>]+data-favorite-list=/g) ?? []).toHaveLength(2);
    expect(elsewhere.match(/class="favorite-card"/g) ?? []).toHaveLength(20);
    expect(elsewhere.match(/data-favorite-kind="film"/g) ?? []).toHaveLength(10);
    expect(elsewhere.match(/data-favorite-kind="album"/g) ?? []).toHaveLength(10);
    expect(elsewhere).toContain('role="tablist"');
    expect(elsewhere).toContain('aria-selected="true"');
    expect(elsewhere).toContain('Movies');
    expect(elsewhere).toContain('Albums');
    expect(elsewhere).toContain('Taxi Driver');
    expect(elsewhere).toContain('The Dark Side of the Moon');
    expect(elsewhere).toContain('1976');
    expect(elsewhere).toContain('Martin Scorsese');
    expect(elsewhere).toContain('Artwork by Guy Peellaert');
    expect(elsewhere).not.toMatch(/<(?:img|source)[^>]+(?:src|srcset)="https:/);
    expect(elsewhere).not.toContain('One-line review');
    expect(elsewhere).not.toMatch(/data-favorite-review="[^"]+"/);
    expect(elsewhere.indexOf('Top tens')).toBeLessThan(elsewhere.indexOf('>Notes<'));
    expect(elsewhere.indexOf('>Notes<')).toBeLessThan(
      elsewhere.indexOf('Pink Floyd, The Beatles, Radiohead, and The Smashing Pumpkins'),
    );
    expect(elsewhere).toMatch(
      /<a[^>]+href="\/elsewhere\/"[^>]+aria-current="page"[^>]*>Elsewhere<\/a>/,
    );
    expectNoHeadingLevelSkips(elsewhere);
  });
```

Add a separate test:

```ts
  it('keeps every favorite readable in the unenhanced document order', () => {
    const elsewhere = readOutput('elsewhere/index.html');
    const filmRanks = [...elsewhere.matchAll(
      /data-favorite-kind="film"[\s\S]*?data-favorite-rank="(\d+)"/g,
    )].map((match) => Number(match[1]));
    const albumRanks = [...elsewhere.matchAll(
      /data-favorite-kind="album"[\s\S]*?data-favorite-rank="(\d+)"/g,
    )].map((match) => Number(match[1]));

    expect(filmRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(albumRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const panels = elsewhere.match(
      /<section[^>]+data-favorite-panel="(?:film|album)"[^>]*>/g,
    ) ?? [];
    expect(panels).toHaveLength(2);
    panels.forEach((panel) => expect(panel).not.toMatch(/\shidden(?:\s|=|>)/));
    expect(elsewhere).toMatch(/<div[^>]+data-favorite-tabs[^>]+\shidden(?:\s|=|>)/);
    expect(
      elsewhere.match(
        /<button(?=[^>]*data-favorite-trigger)(?=[^>]*\sdisabled(?:\s|=|>))[^>]*>/g,
      ) ?? [],
    ).toHaveLength(20);
    expect(elsewhere).not.toContain('data-enhanced');
  });
```

- [ ] **Step 2: Build and verify RED**

Run:

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: the two new Elsewhere tests fail because the stage and records are not rendered.

- [ ] **Step 3: Add reusable English labels**

Replace `en.elsewhere` in `src/i18n/en.ts` with:

```ts
  elsewhere: {
    eyebrow: 'Elsewhere',
    title: 'Elsewhere',
    description: 'Notes on music and other interests.',
    explore: 'Explore',
    topTens: 'Top tens',
    movies: 'Movies',
    albums: 'Albums',
    notes: 'Notes',
    collectionsLabel: 'Favorite collections',
    close: 'Close',
    selectedWork: 'Selected favorite',
    artworkSource: 'Artwork source',
  },
```

- [ ] **Step 4: Create the semantic fan renderer**

Create `src/components/elsewhere/FavoriteFan.astro`:

```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import {
  favoriteCreatorLabel,
  getFavoriteFanPosition,
  type FavoriteKind,
} from '../../lib/favorites';

interface Props {
  favorites: CollectionEntry<'favorites'>[];
  kind: FavoriteKind;
  title: string;
}

const { favorites, kind, title } = Astro.props;
const creatorLabel = favoriteCreatorLabel(kind);
const panelId = `favorite-panel-${kind}`;
const tabId = `favorite-tab-${kind}`;
---

<section
  class="favorite-panel"
  id={panelId}
  role="tabpanel"
  aria-labelledby={tabId}
  data-favorite-panel={kind}
>
  <h3>{title}</h3>
  <div class="favorite-fan__viewport">
    <ol class="favorite-fan" data-favorite-list={kind}>
      {
        favorites.map((favorite) => {
          const position = getFavoriteFanPosition(favorite.data.rank);
          const rank = String(favorite.data.rank).padStart(2, '0');
          const accessibleName = `${rank}. ${favorite.data.title}, ${favorite.data.year}, ${creatorLabel}: ${favorite.data.creator}`;
          const style = [
            `--fan-x:${position.xRem}rem`,
            `--fan-y:${position.yRem}rem`,
            `--fan-rotation:${position.rotationDeg}deg`,
            `--fan-z:${position.zIndex}`,
          ].join(';');

          return (
            <li class="favorite-card" style={style}>
              <button
                type="button"
                class="favorite-card__trigger"
                disabled
                aria-label={accessibleName}
                data-favorite-trigger
                data-favorite-kind={kind}
                data-favorite-rank={favorite.data.rank}
                data-favorite-title={favorite.data.title}
                data-favorite-original-title={favorite.data.originalTitle}
                data-favorite-year={favorite.data.year}
                data-favorite-creator={favorite.data.creator}
                data-favorite-creator-label={creatorLabel}
                data-favorite-review={favorite.data.review}
                data-favorite-cover-credit={favorite.data.coverCredit}
                data-favorite-cover-source={favorite.data.coverSourceUrl}
              >
                <Picture
                  src={favorite.data.cover}
                  alt={favorite.data.coverAlt}
                  widths={[160, 240, 360, 520, 720, 960]}
                  sizes="(max-width: 48rem) 8.5rem, 9.25rem"
                  formats={['avif', 'webp']}
                  loading="lazy"
                />
                <span class="favorite-card__foot">
                  <span class="favorite-card__rank" aria-hidden="true">{rank}</span>
                  <span>{favorite.data.year}</span>
                  <span aria-hidden="true">·</span>
                  <span>{favorite.data.creator}</span>
                </span>
              </button>
            </li>
          );
        })
      }
    </ol>
  </div>
</section>
```

Do not add fan positioning CSS yet. The default component must render as a readable ordered collection before enhancement.

- [ ] **Step 5: Create the stage and shared dialog shell**

Create `src/components/elsewhere/FavoritesStage.astro`:

```astro
---
import type { CollectionEntry } from 'astro:content';
import FavoriteFan from './FavoriteFan.astro';

interface Props {
  films: CollectionEntry<'favorites'>[];
  albums: CollectionEntry<'favorites'>[];
  copy: {
    topTens: string;
    movies: string;
    albums: string;
    collectionsLabel: string;
    close: string;
    selectedWork: string;
    artworkSource: string;
  };
}

const { films, albums, copy } = Astro.props;
---

<favorites-stage>
  <header class="favorites-stage__header">
    <h2>{copy.topTens}</h2>
    <div
      class="favorites-stage__tabs"
      role="tablist"
      aria-label={copy.collectionsLabel}
      data-favorite-tabs
      hidden
    >
      <button
        id="favorite-tab-film"
        type="button"
        role="tab"
        aria-controls="favorite-panel-film"
        aria-selected="true"
        tabindex="0"
        data-favorite-tab="film"
      >
        {copy.movies}
      </button>
      <button
        id="favorite-tab-album"
        type="button"
        role="tab"
        aria-controls="favorite-panel-album"
        aria-selected="false"
        tabindex="-1"
        data-favorite-tab="album"
      >
        {copy.albums}
      </button>
    </div>
  </header>

  <div class="favorites-stage__panels">
    <FavoriteFan favorites={films} kind="film" title={copy.movies} />
    <FavoriteFan favorites={albums} kind="album" title={copy.albums} />
  </div>

  <dialog class="favorite-dialog" aria-labelledby="favorite-dialog-title" data-favorite-dialog>
    <button type="button" class="favorite-dialog__close" data-favorite-close>
      {copy.close}
    </button>
    <article class="favorite-dialog__card" aria-label={copy.selectedWork}>
      <div class="favorite-dialog__art" data-favorite-dialog-art></div>
      <div class="favorite-dialog__caption">
        <p class="favorite-dialog__rank" data-favorite-dialog-rank></p>
        <h3 id="favorite-dialog-title" data-favorite-dialog-title></h3>
        <p class="favorite-dialog__original" data-favorite-dialog-original hidden></p>
        <p class="favorite-dialog__meta" data-favorite-dialog-meta></p>
        <p class="favorite-dialog__review" data-favorite-dialog-review hidden></p>
        <p class="favorite-dialog__credit" data-favorite-dialog-credit hidden></p>
        <a
          class="favorite-dialog__source"
          data-favorite-dialog-source
          target="_blank"
          rel="noreferrer"
          hidden
        >
          {copy.artworkSource}
        </a>
      </div>
    </article>
  </dialog>
</favorites-stage>
```

- [ ] **Step 6: Integrate favorites before Notes**

In `src/pages/elsewhere/index.astro`:

1. import `FavoritesStage`, `assertCompleteFavoriteSet`, and `sortFavorites`;
2. query `const favorites = await getCollection('favorites');`;
3. call `assertCompleteFavoriteSet(favorites, 'en');`;
4. derive `films` and `albums` with `sortFavorites`;
5. set `wide` on `ContentLayout`;
6. render `<FavoritesStage films={films} albums={albums} copy={en.elsewhere} />`;
7. wrap existing entries in a section with `<h2>{en.elsewhere.notes}</h2>`;
8. change each entry title from `h2` to `h3` and update the scoped selector.

The resulting body structure must be:

```astro
<ContentLayout
  title="Elsewhere"
  documentTitle={`Elsewhere | ${site.name}`}
  description={en.elsewhere.description}
  canonicalPath="/elsewhere/"
  wide
>
  <FavoritesStage films={films} albums={albums} copy={en.elsewhere} />
  <section class="elsewhere-notes">
    <h2>{en.elsewhere.notes}</h2>
    {
      entries.map(({ entry, Content }) => (
        <article class="elsewhere-entry">
          <p class="eyebrow">{entry.data.kind}</p>
          <h3>{entry.data.title}</h3>
          <p class="elsewhere-entry__meta">
            <time datetime={entry.data.date.toISOString().slice(0, 10)}>
              {entry.data.date.toISOString().slice(0, 10)}
            </time>
            {' · '}
            {entry.data.tags.join(', ')}
          </p>
          <Content />
        </article>
      ))
    }
  </section>
</ContentLayout>
```

Add only the Notes spacing needed for the static baseline:

```css
  .elsewhere-notes {
    margin-block-start: var(--space-section);
  }

  .elsewhere-notes > h2 {
    margin-block-end: 2rem;
    font-size: clamp(2rem, 4vw, 3.25rem);
  }

  .elsewhere-entry h3 {
    margin-block-end: 0.75rem;
    font-size: clamp(1.7rem, 3vw, 2.3rem);
  }
```

- [ ] **Step 7: Build and verify GREEN**

Run:

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts
npm run check
```

Expected: site-output tests pass, both collections are readable without enhancement, and Astro check is clean.

- [ ] **Step 8: Commit**

```powershell
git add -- src/components/elsewhere src/pages/elsewhere/index.astro src/i18n/en.ts tests/site-output.test.ts
git commit -m "feat: render favorite collections"
```

### Task 4: Apply the shallow-fan visual system

**Files:**
- Modify: `src/components/elsewhere/FavoriteFan.astro`
- Modify: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write a failing source-contract test for the visual constraints**

Add:

```ts
  it('implements the favorite fan as a gated, restrained visual enhancement', () => {
    const fan = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoriteFan.astro'),
      'utf8',
    );
    const stage = readFileSync(
      join(projectRoot, 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );
    const source = `${fan}\n${stage}`;

    expect(source).toContain(':global(favorites-stage[data-enhanced])');
    expect(source).toContain('overflow-x: auto');
    expect(source).toContain('var(--fan-x)');
    expect(source).toContain('var(--fan-y)');
    expect(source).toContain('var(--fan-rotation)');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?favorite-card:hover[\s\S]*?var\(--fan-y\)[\s\S]*?var\(--fan-rotation\)/,
    );
    expect(source).not.toContain('gradient(');
    expect(source).not.toMatch(/\bfilter\s*:/);
    expect(source).not.toContain('mix-blend-mode');
    expect(source).not.toContain('border-radius');
    expect(source).not.toContain('\u2013');
    expect(source).not.toContain('\u2014');
  });
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the fan CSS has not been added.

- [ ] **Step 3: Add component-scoped fan CSS**

Add styles to `FavoriteFan.astro` with these exact contracts:

```css
  .favorite-panel h3 {
    margin-block-end: 1.5rem;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
  }

  .favorite-fan {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .favorite-card__trigger {
    position: relative;
    width: 100%;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--color-rule);
    background: var(--color-paper);
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: default;
    opacity: 1;
  }

  .favorite-card__trigger :global(picture),
  .favorite-card__trigger :global(img) {
    width: 100%;
  }

  .favorite-card__trigger :global(img) {
    aspect-ratio: 2 / 3;
    object-fit: contain;
    background: var(--color-paper);
  }

  .favorite-card__trigger[data-favorite-kind='album'] :global(img) {
    aspect-ratio: 1;
  }

  .favorite-card__rank {
    color: var(--favorite-accent);
    font-size: 0.68rem;
    font-weight: 650;
    letter-spacing: 0.08em;
  }

  .favorite-card__foot {
    display: flex;
    gap: 0.38rem;
    min-height: 3.6rem;
    align-items: center;
    padding: 0.8rem;
    color: var(--color-muted);
    font-size: 0.76rem;
    line-height: 1.3;
  }

  :global(favorites-stage[data-enhanced]) .favorite-panel[hidden] {
    display: none;
  }

  :global(favorites-stage[data-enhanced]) .favorite-panel h3 {
    display: none;
  }

  :global(favorites-stage[data-enhanced]) .favorite-card__trigger {
    cursor: pointer;
  }

  :global(favorites-stage[data-enhanced]) .favorite-fan__viewport {
    overflow-x: auto;
    overflow-y: clip;
    padding: 2.5rem max(1rem, calc((100% - 46rem) / 2)) 1rem;
  }

  :global(favorites-stage[data-enhanced]) .favorite-fan {
    position: relative;
    display: block;
    width: 46rem;
    height: 31rem;
    margin-inline: auto;
  }

  :global(favorites-stage[data-enhanced]) .favorite-card {
    position: absolute;
    left: 50%;
    bottom: 3.5rem;
    z-index: var(--fan-z);
    width: 9.25rem;
    transform:
      translate3d(calc(-50% + var(--fan-x)), var(--fan-y), 0)
      rotate(var(--fan-rotation));
    transform-origin: 50% 145%;
    transition:
      transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity 180ms ease;
  }

  :global(favorites-stage[data-enhanced]) .favorite-card:hover,
  :global(favorites-stage[data-enhanced]) .favorite-card:focus-within {
    z-index: 30;
    transform:
      translate3d(calc(-50% + var(--fan-x)), calc(var(--fan-y) - 1rem), 0)
      rotate(0deg);
  }

  @media (max-width: 48rem) {
    .favorite-fan {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :global(favorites-stage[data-enhanced]) .favorite-fan__viewport {
      padding-inline: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(favorites-stage[data-enhanced]) .favorite-card {
      transition: none;
    }

    :global(favorites-stage[data-enhanced]) .favorite-card:hover,
    :global(favorites-stage[data-enhanced]) .favorite-card:focus-within {
      transform:
        translate3d(calc(-50% + var(--fan-x)), var(--fan-y), 0)
        rotate(var(--fan-rotation));
    }
  }
```

The trigger already carries `data-favorite-kind={kind}`. Use that attribute for
the album aspect ratio rather than inventing a separate component.

- [ ] **Step 4: Add stage and dialog visual CSS**

Add styles to `FavoritesStage.astro`:

```css
  favorites-stage {
    --favorite-accent: #9f3d2f;

    display: block;
  }

  .favorites-stage__header {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    align-items: end;
    padding-block-end: 1rem;
    border-bottom: 1px solid var(--color-rule);
  }

  .favorites-stage__header h2 {
    margin: 0;
    font-size: clamp(2.5rem, 5vw, 4.25rem);
  }

  favorites-stage[data-enhanced] .favorites-stage__tabs {
    display: flex;
    gap: 1.35rem;
  }

  favorites-stage[data-enhanced] .favorites-stage__tabs button,
  favorites-stage[data-enhanced] .favorite-dialog__close {
    padding: 0.35rem 0;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: var(--color-muted);
    font: 650 0.78rem/1 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }

  favorites-stage[data-enhanced] .favorites-stage__tabs button[aria-selected='true'] {
    border-bottom-color: var(--favorite-accent);
    color: var(--color-text);
  }

  .favorites-stage__panels {
    padding-block-start: 2rem;
  }

  .favorite-dialog {
    width: min(calc(100% - 2rem), 30rem);
    max-height: calc(100dvh - 2rem);
    padding: 0;
    overflow: auto;
    border: 1px solid var(--color-text);
    background: var(--color-paper);
    color: var(--color-text);
    box-shadow: 0.75rem 0.85rem 0 rgb(17 17 15 / 0.12);
  }

  .favorite-dialog::backdrop {
    background: rgb(17 17 15 / 0.42);
  }

  .favorite-dialog__close {
    position: sticky;
    z-index: 4;
    top: 0;
    display: block;
    margin-left: auto;
    padding: 0.85rem 1rem;
    border-bottom: 0;
    background: var(--color-paper);
    color: var(--color-text);
  }

  .favorite-dialog__card {
    display: grid;
  }

  .favorite-dialog__art {
    grid-area: 1 / 1;
    align-self: start;
  }

  .favorite-dialog__art :global(picture),
  .favorite-dialog__art :global(img) {
    width: 100%;
  }

  .favorite-dialog__art :global(img) {
    max-height: 78dvh;
    object-fit: contain;
    background: var(--color-paper);
  }

  .favorite-dialog__caption {
    z-index: 1;
    grid-area: 1 / 1;
    align-self: end;
    padding: 1.15rem;
    background: rgb(17 17 15 / 0.86);
    color: #f7f5ef;
  }

  .favorite-dialog__caption h3 {
    margin: 0.25rem 0;
    font-size: clamp(1.45rem, 4vw, 2rem);
  }

  .favorite-dialog__rank,
  .favorite-dialog__original,
  .favorite-dialog__meta,
  .favorite-dialog__review,
  .favorite-dialog__credit {
    margin: 0;
  }

  .favorite-dialog__rank,
  .favorite-dialog__meta {
    color: rgb(247 245 239 / 0.72);
    font: 600 0.76rem/1.4 var(--font-body);
  }

  .favorite-dialog__original {
    margin-block-start: 0.25rem;
    color: rgb(247 245 239 / 0.82);
    font-size: 0.86rem;
  }

  .favorite-dialog__review {
    margin-block-start: 0.9rem;
    padding-block-start: 0.8rem;
    border-top: 1px solid rgb(247 245 239 / 0.28);
    font-family: var(--font-display);
    font-size: 1rem;
    line-height: 1.45;
  }

  .favorite-dialog__credit,
  .favorite-dialog__source {
    color: rgb(247 245 239 / 0.76);
    font: 500 0.68rem/1.4 var(--font-body);
  }

  .favorite-dialog__credit {
    margin-block-start: 0.8rem;
  }

  .favorite-dialog__source {
    margin-block-start: 0.35rem;
    text-underline-offset: 0.16em;
  }

  .favorite-dialog__source:not([hidden]) {
    display: inline-block;
  }

  @media (max-width: 48rem) {
    .favorites-stage__header {
      align-items: start;
      flex-direction: column;
    }

    .favorite-dialog {
      width: calc(100% - 1rem);
      max-height: calc(100dvh - 1rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    favorites-stage[data-enhanced] .favorites-stage__tabs button,
    .favorite-dialog {
      scroll-behavior: auto;
    }
  }
```

Do not add any radius, gradient, filter, blend mode, or theme inversion.

- [ ] **Step 5: Run visual source checks and full static verification**

Run:

```powershell
npx vitest run src/lib/favorites.test.ts tests/source-contracts.test.ts
npm run check
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: all commands exit zero.

- [ ] **Step 6: Commit**

```powershell
git add -- src/components/elsewhere/FavoriteFan.astro src/components/elsewhere/FavoritesStage.astro tests/source-contracts.test.ts
git commit -m "feat: style shallow favorite fan"
```

### Task 5: Add tested tabs and focus-card interaction

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/scripts/favorites-stage.test.ts`
- Create: `src/scripts/favorites-stage.ts`
- Modify: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `tests/site-output.test.ts`

- [ ] **Step 1: Install the DOM test environment**

Run:

```powershell
npm install --save-dev happy-dom
```

Expected: `happy-dom` appears only under `devDependencies`; no runtime dependency is added.

- [ ] **Step 2: Write failing interaction tests**

Create `src/scripts/favorites-stage.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function fixture(): HTMLElement {
  const host = document.createElement('favorites-stage');
  host.innerHTML = `
    <div role="tablist" aria-label="Favorite collections" data-favorite-tabs hidden>
      <button id="favorite-tab-film" role="tab" aria-selected="true"
        aria-controls="favorite-panel-film" tabindex="0" data-favorite-tab="film">Movies</button>
      <button id="favorite-tab-album" role="tab" aria-selected="false"
        aria-controls="favorite-panel-album" tabindex="-1" data-favorite-tab="album">Albums</button>
    </div>
    <section id="favorite-panel-film" role="tabpanel" data-favorite-panel="film">
      <button type="button" disabled data-favorite-trigger data-favorite-kind="film"
        data-favorite-rank="1" data-favorite-title="Taxi Driver"
        data-favorite-year="1976" data-favorite-creator="Martin Scorsese"
        data-favorite-creator-label="Director"
        data-favorite-cover-credit="Artwork by Guy Peellaert."
        data-favorite-cover-source="https://example.com/taxi">
        <picture>
          <source sizes="9rem" srcset="/taxi-360.avif 360w, /taxi-960.avif 960w">
          <img src="/taxi.jpg" sizes="9rem" alt="Taxi Driver poster">
        </picture>
      </button>
    </section>
    <section id="favorite-panel-album" role="tabpanel" data-favorite-panel="album">
      <button type="button" disabled data-favorite-trigger data-favorite-kind="album"
        data-favorite-rank="4" data-favorite-title="OK Computer"
        data-favorite-year="1997" data-favorite-creator="Radiohead"
        data-favorite-creator-label="Artist" data-favorite-review="A written note."
        data-favorite-cover-credit="Artwork by Stanley Donwood and Thom Yorke."
        data-favorite-cover-source="https://example.com/ok-computer">
        <picture><img src="/ok-computer.jpg" sizes="9rem" alt="OK Computer cover"></picture>
      </button>
    </section>
    <dialog data-favorite-dialog aria-labelledby="favorite-dialog-title">
      <button type="button" data-favorite-close>Close</button>
      <div data-favorite-dialog-art></div>
      <p data-favorite-dialog-rank></p>
      <h3 id="favorite-dialog-title" data-favorite-dialog-title></h3>
      <p data-favorite-dialog-original hidden></p>
      <p data-favorite-dialog-meta></p>
      <p data-favorite-dialog-review hidden></p>
      <p data-favorite-dialog-credit hidden></p>
      <a data-favorite-dialog-source hidden>Artwork source</a>
    </dialog>
  `;
  return host;
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('favorites-stage', () => {
  it('enhances only after connection and selects Movies initially', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);

    expect(host.hasAttribute('data-enhanced')).toBe(true);
    expect(host.querySelector('[data-favorite-tabs]')?.hasAttribute('hidden')).toBe(false);
    expect(
      [...host.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]')].every(
        (trigger) => !trigger.disabled,
      ),
    ).toBe(true);
    expect(
      host.querySelector('[data-favorite-panel="film"]')?.hasAttribute('hidden'),
    ).toBe(false);
    expect(
      host.querySelector('[data-favorite-panel="album"]')?.hasAttribute('hidden'),
    ).toBe(true);
  });

  it('switches tabs with ArrowRight and moves focus', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const filmTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="film"]')!;
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;

    filmTab.focus();
    filmTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(albumTab.getAttribute('aria-selected')).toBe('true');
    expect(albumTab.tabIndex).toBe(0);
    expect(document.activeElement).toBe(albumTab);
    expect(
      host.querySelector('[data-favorite-panel="album"]')?.hasAttribute('hidden'),
    ).toBe(false);
  });

  it('opens one focus card with cloned artwork and no empty review region', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;

    trigger.click();

    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('[data-favorite-dialog-art] img')?.getAttribute('src')).toBe(
      '/taxi.jpg',
    );
    expect(dialog.querySelector('[data-favorite-dialog-title]')?.textContent).toBe('Taxi Driver');
    expect(dialog.querySelector('[data-favorite-dialog-rank]')?.textContent).toBe('01');
    expect(dialog.querySelector('[data-favorite-dialog-meta]')?.textContent).toBe(
      '1976 · Director: Martin Scorsese',
    );
    expect(
      dialog.querySelector('[data-favorite-dialog-review]')?.hasAttribute('hidden'),
    ).toBe(true);
    expect(
      [...dialog.querySelectorAll<HTMLElement>('[data-favorite-dialog-art] [sizes]')].every(
        (element) => element.getAttribute('sizes') === '(max-width: 48rem) 92vw, 30rem',
      ),
    ).toBe(true);
    expect(dialog.querySelector('[data-favorite-dialog-credit]')?.textContent).toBe(
      'Artwork by Guy Peellaert.',
    );
    expect(
      dialog.querySelector<HTMLAnchorElement>('[data-favorite-dialog-source]')?.href,
    ).toBe('https://example.com/taxi');
  });

  it('reveals a written review inside the enlarged card', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="album"]')!;

    albumTab.click();
    trigger.click();

    const review = host.querySelector<HTMLElement>('[data-favorite-dialog-review]')!;
    expect(review.hasAttribute('hidden')).toBe(false);
    expect(review.textContent).toBe('A written note.');
  });

  it('closes before switching categories and leaves focus on the new tab', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    albumTab.focus();
    albumTab.click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(albumTab);
    expect(albumTab.getAttribute('aria-selected')).toBe('true');
  });

  it('closes from the backdrop and restores trigger focus', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('restores trigger focus when the native dialog close path runs', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    dialog.dispatchEvent(new Event('cancel'));
    dialog.close();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes from its close button without registering duplicate listeners', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    document.body.removeChild(host);
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const close = host.querySelector<HTMLButtonElement>('[data-favorite-close]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;
    const closeSpy = vi.spyOn(dialog, 'close');

    trigger.click();
    close.click();

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
```

- [ ] **Step 3: Run the interaction test and verify RED**

Run:

```powershell
npx vitest run src/scripts/favorites-stage.test.ts
```

Expected: FAIL because `src/scripts/favorites-stage.ts` does not exist.

- [ ] **Step 4: Implement the custom element**

Create `src/scripts/favorites-stage.ts`:

```ts
type FavoriteKind = 'film' | 'album';

const tagName = 'favorites-stage';

function isFavoriteKind(value: string | undefined): value is FavoriteKind {
  return value === 'film' || value === 'album';
}

class FavoritesStageElement extends HTMLElement {
  #abortController?: AbortController;
  #dialog?: HTMLDialogElement;
  #lastTrigger?: HTMLButtonElement;
  #restoreFocusAfterClose = true;

  connectedCallback(): void {
    if (this.#abortController) return;

    this.#abortController = new AbortController();
    const signal = this.#abortController.signal;
    this.#dialog = this.querySelector<HTMLDialogElement>('[data-favorite-dialog]') ?? undefined;

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]').forEach((tab) => {
      tab.addEventListener('click', () => this.#selectCategory(tab.dataset.favoriteTab), { signal });
      tab.addEventListener('keydown', (event) => this.#handleTabKey(event), { signal });
    });

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => this.#openFavorite(trigger), { signal });
    });

    this.querySelector<HTMLButtonElement>('[data-favorite-close]')?.addEventListener(
      'click',
      () => this.#dialog?.close(),
      { signal },
    );

    this.#dialog?.addEventListener(
      'click',
      (event) => {
        if (event.target === this.#dialog) this.#dialog.close();
      },
      { signal },
    );

    this.#dialog?.addEventListener(
      'close',
      () => {
        if (this.#restoreFocusAfterClose) this.#lastTrigger?.focus();
        this.#restoreFocusAfterClose = true;
      },
      { signal },
    );

    this.#selectCategory('film');
    this.setAttribute('data-enhanced', '');
    this.querySelector<HTMLElement>('[data-favorite-tabs]')?.removeAttribute('hidden');
    this.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]').forEach((trigger) => {
      trigger.disabled = false;
    });
  }

  disconnectedCallback(): void {
    this.#abortController?.abort();
    this.#abortController = undefined;
  }

  #selectCategory(value: string | undefined): void {
    if (!isFavoriteKind(value)) return;
    if (this.#dialog?.open) {
      this.#restoreFocusAfterClose = false;
      this.#dialog.close();
    }

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]').forEach((tab) => {
      const selected = tab.dataset.favoriteTab === value;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    this.querySelectorAll<HTMLElement>('[data-favorite-panel]').forEach((panel) => {
      panel.toggleAttribute('hidden', panel.dataset.favoritePanel !== value);
    });
  }

  #handleTabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const tabs = [...this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]')];
    const current = tabs.indexOf(event.currentTarget as HTMLButtonElement);
    if (current < 0) return;

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(current + direction + tabs.length) % tabs.length];
    this.#selectCategory(next.dataset.favoriteTab);
    next.focus();
  }

  #openFavorite(trigger: HTMLButtonElement): void {
    if (!this.#dialog) return;
    this.#lastTrigger = trigger;
    this.#restoreFocusAfterClose = true;

    const art = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-art]');
    const picture = trigger.querySelector('picture')?.cloneNode(true) as HTMLElement | undefined;
    if (art && picture) {
      picture.querySelectorAll<HTMLElement>('[sizes]').forEach((element) => {
        element.setAttribute('sizes', '(max-width: 48rem) 92vw, 30rem');
      });
      art.replaceChildren(picture);
    }

    const setText = (selector: string, value: string | undefined): void => {
      const element = this.#dialog?.querySelector<HTMLElement>(selector);
      if (!element) return;
      element.textContent = value ?? '';
    };

    const rank = String(trigger.dataset.favoriteRank ?? '').padStart(2, '0');
    setText('[data-favorite-dialog-rank]', rank);
    setText('[data-favorite-dialog-title]', trigger.dataset.favoriteTitle);
    setText(
      '[data-favorite-dialog-meta]',
      `${trigger.dataset.favoriteYear} · ${trigger.dataset.favoriteCreatorLabel}: ${trigger.dataset.favoriteCreator}`,
    );

    const original = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-original]');
    const review = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-review]');
    const credit = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-credit]');
    for (const [element, value] of [
      [original, trigger.dataset.favoriteOriginalTitle],
      [review, trigger.dataset.favoriteReview],
      [credit, trigger.dataset.favoriteCoverCredit],
    ] as const) {
      if (!element) continue;
      element.textContent = value ?? '';
      element.toggleAttribute('hidden', !value);
    }

    const source = this.#dialog.querySelector<HTMLAnchorElement>('[data-favorite-dialog-source]');
    const sourceUrl = trigger.dataset.favoriteCoverSource;
    if (source && sourceUrl) {
      source.href = sourceUrl;
      source.removeAttribute('hidden');
    } else if (source) {
      source.removeAttribute('href');
      source.setAttribute('hidden', '');
    }

    this.#dialog.showModal();
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, FavoritesStageElement);
}
```

- [ ] **Step 5: Run the interaction test and verify GREEN**

Run:

```powershell
npx vitest run src/scripts/favorites-stage.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 6: Write a failing built-script policy test**

Change the `node:path` import to `import { join, relative } from 'node:path';`,
then change `expectDocumentShell` in `tests/site-output.test.ts` to accept an
optional script count:

```ts
function executableScripts(page: string): string[] {
  return page.match(/<script(?![^>]*type="application\/ld\+json")[^>]*>/g) ?? [];
}

function expectDocumentShell(
  page: string,
  canonicalPath: string,
  title: string,
  executableScriptCount = 0,
): void {
  expect(page).toContain(`<title>${title}</title>`);
  expect(page).toContain(
    `<link rel="canonical" href="https://stylewth.github.io${canonicalPath}">`,
  );
  expect(page.match(/<h1(?:\s|>)/g) ?? []).toHaveLength(1);
  expect(executableScripts(page)).toHaveLength(executableScriptCount);
}
```

Call it for Elsewhere as:

```ts
expectDocumentShell(elsewhere, '/elsewhere/', 'Elsewhere | Tenghao Wang', 1);
```

Replace the global executable-script test with:

```ts
  it('ships one route-local interaction script only on Elsewhere', () => {
    outputHtmlFiles().forEach((file) => {
      const page = readFileSync(file, 'utf8');
      const relativePath = relative(outputDirectory, file).replaceAll('\\', '/');
      expect(executableScripts(page), relativePath).toHaveLength(
        relativePath === 'elsewhere/index.html' ? 1 : 0,
      );
    });
  });
```

Add this assertion to the Elsewhere Top Tens test:

```ts
expect(elsewhere).toMatch(
  /<script(?=[^>]+type="module")(?=[^>]+src="\/_astro\/[^"]+\.js")[^>]*>/,
);
```

- [ ] **Step 7: Build and verify RED for the route-local script**

Run:

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: FAIL because Elsewhere still emits zero executable scripts.

- [ ] **Step 8: Load the interaction module from the stage**

Append to `FavoritesStage.astro`:

```astro
<script>
  import '../../scripts/favorites-stage';
</script>
```

- [ ] **Step 9: Run interaction, build, and route-policy verification**

Run:

```powershell
npx vitest run src/scripts/favorites-stage.test.ts
npm run check
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: all commands pass with exactly one bundled interaction script on `/elsewhere/`.

- [ ] **Step 10: Commit**

```powershell
git add -- package.json package-lock.json src/scripts/favorites-stage.ts src/scripts/favorites-stage.test.ts src/components/elsewhere/FavoritesStage.astro tests/site-output.test.ts
git commit -m "feat: add favorite fan interaction"
```

### Task 6: Document maintenance and publication rules

**Files:**
- Modify: `README.md`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Extend the README contract test and verify RED**

Add these expectations to the existing README maintenance test:

```ts
    expect(readme).toContain('## Favorite Markdown example');
    expect(readme).toContain('review is optional');
    expect(readme).toContain('coverSourceUrl');
    expect(readme).toContain('editionNote');
    expect(readme).toContain('exactly 10 films and 10 albums');
    expect(readme).toContain('artwork permission and attribution gate');
```

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the new maintenance documentation is absent.

- [ ] **Step 2: Add the exact maintenance section**

Append to `README.md`:

````markdown
## Favorite Markdown example

Favorites live under `src/content/favorites/film/` and
`src/content/favorites/album/`. Each language must contain exactly 10 films
and 10 albums with complete, unique ranks from 1 through 10.

```yaml
---
title: Taxi Driver
translationKey: taxi-driver
kind: film
rank: 1
year: 1976
creator: Martin Scorsese
cover: ../../../assets/images/favorites/films/film-01-taxi-driver-us-theatrical.jpg
coverAlt: Original theatrical poster for Taxi Driver
coverSourceUrl: https://www.impawards.com/1976/taxi_driver_ver1.html
coverCredit: Artwork by Guy Peellaert. Poster copyright Columbia Pictures.
editionNote: 1976 first-run US Columbia one-sheet
# review: Add one sentence here; omit this field when blank.
lang: en
---
```

The `review` field is optional. Omit it entirely until a note is written.
An empty review is invalid.
Reorder the collection by editing `rank`, then keep each kind as a complete
1-10 set. Use the original standard album cover or the film's production-
territory theatrical poster. Do not recolor, crop, hotlink, or replace covers
with generated imitations.

The artwork permission and attribution gate applies before public deployment:
every cover needs a traceable `coverSourceUrl`, exact `editionNote`, and any
required `coverCredit`.
````

- [ ] **Step 3: Run the documentation contract and full unit suite**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```powershell
git add -- README.md tests/source-contracts.test.ts
git commit -m "docs: explain favorite collection maintenance"
```

### Task 7: Full verification and visual QA

**Files:**
- Modify only if a failing test or observed defect requires a test-first fix.

- [ ] **Step 1: Run the complete automated gate**

Run:

```powershell
npm run build
```

Expected:

- Astro check: zero errors, warnings, and hints;
- unit tests: all pass;
- static build: all routes generated;
- site-output tests: all pass.

- [ ] **Step 2: Run mechanical design and privacy checks**

Run:

```powershell
rg -n "—|–|gradient\\(|\\bfilter\\s*:|mix-blend-mode|h-screen|scroll-snap" src
git status --short
```

Expected: the first command has no matches; status contains only intentional implementation changes, preferably none after task commits.

- [ ] **Step 3: Start a local production preview**

Start the preview as a hidden background process, capture its process ID, and
poll the fixed localhost URL until it responds. Do not leave a blocking
foreground command running:

```powershell
$preview = Start-Process -FilePath npm.cmd -ArgumentList @(
  'run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321'
) -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru
Invoke-WebRequest -Uri 'http://127.0.0.1:4321/elsewhere/' -UseBasicParsing
```

Keep `http://127.0.0.1:4321/` and `$preview.Id` for browser QA, then stop that
exact process after verification.

- [ ] **Step 4: Verify desktop behavior at 1440 px**

Using the in-app browser:

1. open `/elsewhere/`;
2. confirm Movies is active and the shallow fan is centered;
3. focus ranks 1, 5, and 10 and confirm each rises without changing DOM order;
4. open Taxi Driver and verify rank, title, year, director, and standard poster;
5. confirm no review divider or blank review area appears;
6. close by button, backdrop, and `Escape`, checking focus restoration each time;
7. switch to Albums by click and Arrow keys;
8. open OK Computer and verify album metadata;
9. inspect the console for errors.

- [ ] **Step 5: Verify tablet and mobile behavior**

At 768 px and 390 px:

1. confirm there is no page-level horizontal overflow;
2. confirm the fan's own viewport scrolls horizontally;
3. confirm covers remain legible and tappable;
4. confirm one tap opens the focus card;
5. confirm the dialog fits `100dvh`, scrolls internally if required, and keeps Close visible;
6. confirm Notes remains after the collection stage.
7. at 390 px and 200% browser zoom, confirm every caption field and the Close
   control remain reachable by scrolling.

- [ ] **Step 6: Verify reduced motion and no-JavaScript fallbacks**

1. emulate `prefers-reduced-motion: reduce` and confirm hover/focus no longer
   lifts or de-rotates cards;
2. disable JavaScript or inspect the server-rendered HTML;
3. confirm both complete ordered lists remain visible in rank order;
4. confirm all years and creators remain present.

- [ ] **Step 7: Run the design-taste pre-flight relevant to this page**

Confirm:

- one light theme only;
- one restrained warm-red accent;
- one sharp-corner system;
- Newsreader remains justified by the existing editorial identity;
- no em dash or en dash;
- no gradient, filter, blend mode, pills, fake covers, decorative dots, scroll cues, or version labels;
- motion communicates focus and state change only;
- standard artwork remains unaltered;
- all visible English copy is grammatical;
- no runtime framework or animation dependency was added;
- focus contrast, button contrast, and overlay text meet WCAG AA;
- LCP, CLS, and interaction behavior remain plausible for a static portfolio page.

- [ ] **Step 8: Fix any discovered defect with a fresh red-green cycle**

For every defect:

1. add the smallest failing automated regression test;
2. run it and observe the expected failure;
3. implement the minimal fix;
4. rerun the focused test;
5. rerun `npm run build`;
6. commit the fix separately.

- [ ] **Step 9: Record final evidence**

Capture:

- the final `npm run build` output;
- browser screenshots at 390, 768, and 1440 px;
- the clean console result;
- `git status --short`;
- final commit list.

Do not claim completion without this fresh evidence.

## Cover acquisition manifest

The implementation worker must use the exact rows below. `Source page` is stored
as `coverSourceUrl`; `Direct image` is downloaded to the production filename.
The source page must visibly identify the same edition before download.

### Films

| Rank | Production filename | Exact edition | Source page | Direct image | Credit and deployment note |
|---:|---|---|---|---|---|
| 1 | `film-01-taxi-driver-us-theatrical.jpg` | 1976 first-run US Columbia one-sheet | `https://www.impawards.com/1976/taxi_driver_ver1.html` | `https://www.impawards.com/1976/posters/taxi_driver_ver1_xxlg.jpg` | Artwork by Guy Peellaert. Copyright Columbia Pictures. |
| 2 | `film-02-a-beautiful-mind-us-theatrical.jpg` | 2001 first-run US main theatrical poster | `https://www.impawards.com/2001/beautiful_mind.html` | `https://www.impawards.com/2001/posters/beautiful_mind_xxlg.jpg` | Poster design by InSync Plus. Copyright Universal Pictures and DreamWorks. |
| 3 | `film-03-interstellar-us-theatrical.jpg` | 2014 US theatrical teaser one-sheet with star-field title art | `https://www.impawards.com/2014/interstellar.html` | `https://www.impawards.com/2014/posters/interstellar_xxlg.jpg` | Poster design by BLT Communications, LLC. Copyright Paramount and Warner Bros. |
| 4 | `film-04-eat-drink-man-woman-tw-theatrical.jpg` | 1994 first-run Taiwan theatrical poster | `https://collections.nmth.gov.tw/CollectionContent.aspx?a=132&rno=2010.019.1068` | `https://collections.culture.tw/files/11/JPG640/20100191068_I001.jpg` | Credit National Museum of Taiwan History, collection 2010.019.1068. The collection scan is not an open license. |
| 5 | `film-05-titanic-us-theatrical.jpg` | 1997 first-run US Jack and Rose main poster | `https://www.impawards.com/1997/titanic_ver2.html` | `https://www.impawards.com/1997/posters/titanic_ver2_xxlg.jpg` | Poster design by BLT Communications, LLC. Copyright Paramount, 20th Century Fox, and Lightstorm. |
| 6 | `film-06-burning-kr-theatrical.jpg` | 2018 first-run South Korea main poster | `https://www.koreanfilm.or.kr/eng/films/index/filmsView.jsp?category=ALL&mode=INDEX_FILMS_LIST&movieCd=20173202&pageIndex=1&pageRowSize=10&peopleCd=&s_genre=ALL&searchKeyword=Lee+Chang-dong&searchType=DIRECTOR&strMenuId=010401&userId=` | `https://kobis.or.kr/common/mast/movie/2018/05/7d89fab99a414bf48213913d5ac5c7ce.jpg` | Source KOFIC/KOBIS. Verify publisher and artist credit before deployment. |
| 7 | `film-07-paprika-jp-theatrical.jpg` | 2006 Japan first-release theatrical one-sheet, standard B2 artwork | `https://www.sonypictures.jp/he/815804` | `https://www.sonypictures.jp/sites/default/files/styles/keyart_large/public/2018-06/815804.jpg?itok=-pEzfhNS` | Main visual by Satoshi Kon. Copyright 2006 Madhouse and Sony Pictures Entertainment Japan. Version identity is cross-checked against Madhouse's 2006 release notices and Kon's own main-visual record. |
| 8 | `film-08-in-the-mood-for-love-hk-theatrical.jpg` | 2000 Hong Kong original-release B1 poster, Style B, 27 × 38 inches; catalogue cross-check pending | `https://posteritati.com/poster/14327/in-the-mood-for-love-original-2000-hong-kong-b1-movie-poster` | `https://cdn.posteritati.com/posters/000/000/054/466/in-the-mood-for-love-md-web.jpg` | Poster design attributed to Rex Koo. Rights remain with Jet Tone Films, Block 2 Pictures, and related contributors. The version is independently cross-identified by Filmposter as the 2000 country-of-origin Hong Kong Style B, but no first-party archive has yet confirmed the style. |
| 9 | `film-09-love-letter-jp-theatrical.jpg` | Original 1995 Japanese theatrical B2 poster, 515 × 728 mm, Herald Ace and Nippon Herald Films | `https://cineswitch.com/movie_detail/love-letter` | `https://cineswitch.com/wp-content/uploads/2020/04/m0037_Love-Letter-scaled-1.jpg` | Copyright Fuji Television; distributed by Herald Ace and Nippon Herald Films. Version identity is also documented as item 68 in the Kochi Museum of Art collection catalogue. |
| 10 | `film-10-the-prestige-us-theatrical.jpg` | 2006 first-run US main one-sheet | `https://www.impawards.com/2006/prestige.html` | `https://www.impawards.com/2006/posters/prestige_xxlg.jpg` | Poster design by BLT Communications, LLC. Copyright Warner Bros. and Touchstone. |

### Albums

| Rank | Production filename | Exact edition | Source page | Direct image | Credit and deployment note |
|---:|---|---|---|---|---|
| 1 | `album-01-the-dark-side-of-the-moon.jpg` | 1973 UK standard LP, Harvest SHVL 804 | `https://musicbrainz.org/release/b84ee12a-09ef-421b-82de-0441a926375b/cover-art` | `https://archive.org/download/mbid-b84ee12a-09ef-421b-82de-0441a926375b/mbid-b84ee12a-09ef-421b-82de-0441a926375b-1611507818_thumb1200.jpg` | Artwork by Hipgnosis and George Hardie. Cover Art Archive does not grant artwork copyright. |
| 2 | `album-02-the-key.jpg` | 2013 Hong Kong standard 8-track album | `https://music.apple.com/us/album/the-key/1386714588` | `https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/1c/c0/d3/1cc0d357-4642-a5c6-4ad6-57add94791b3/00602567727873.rgb.jpg/1200x1200bb.jpg` | Rights holder EAS Music Ltd. Artwork is attributed to Prodip Leung and must be checked against the liner notes before deployment. |
| 3 | `album-03-heisei-fuuzoku.jpg` | 2007 Japan regular CD, TOCT-26210 | `https://music.apple.com/us/album/heisei-fuuzoku-japanese-manners/1384785330` | `https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/80/31/6e/80316e08-dd8c-b740-fad9-ac41fa740022/18UMGIM22271.rgb.jpg/1200x1200bb.jpg` | Edition cross-check: `https://www.universal-music.co.jp/sheena-ringo/products/toct-26210/`. Universal forbids unauthorized reproduction. Verify design credit before deployment. |
| 4 | `album-04-ok-computer.jpg` | 1997 UK and Europe standard 12-track CD, Parlophone CDNODATA 02 | `https://musicbrainz.org/release/425d8db9-88a3-31e2-bd23-b1a967626dd5/cover-art` | `https://archive.org/download/mbid-425d8db9-88a3-31e2-bd23-b1a967626dd5/mbid-425d8db9-88a3-31e2-bd23-b1a967626dd5-7955655569_thumb1200.jpg` | Artwork commonly credited to Stanley Donwood and Thom Yorke, The White Chocolate Farm. Verify original liner-note wording. |
| 5 | `album-05-karuki-zahmen-kuri-no-hana.jpg` | 2003 Japan original Copy Control CD, TOCT-24942 | `https://music.apple.com/jp/album/karuki-zahmen-kuri-no-hana-kalk-samen-chestnut-flower/1385320232` | `https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ab/82/dd/ab82dda9-9724-0562-8068-f8d20dac80fa/00602567661313.rgb.jpg/1200x1200bb.jpg` | Edition cross-check: `https://www.universal-music.co.jp/sheena-ringo/products/toct-24942/`. Rights holder Universal Music. Verify photography and design credits. |
| 6 | `album-06-inside-the-cable-temple.jpg` | 2020 original standard 8-track digital release | `https://music.apple.com/tw/album/%E5%86%80%E8%A5%BF%E5%8D%97%E6%9E%97%E8%B7%AF%E8%A1%8C/1545534900` | `https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/c5/bd/a6/c5bda6ad-0ed6-849d-dc07-c6b527c0b5aa/cover.jpg/1200x1200bb.jpg` | Rights holder shown as Omnipotent Youth Society. Verify cover-artist credit. |
| 7 | `album-07-siamese-dream.jpg` | 1993 original US standard CD, Virgin 0777 7 88267 2 9 | `https://musicbrainz.org/release/8d967bcd-02e3-380f-8e0d-2f3cfb79561d/cover-art` | `https://archive.org/download/mbid-8d967bcd-02e3-380f-8e0d-2f3cfb79561d/mbid-8d967bcd-02e3-380f-8e0d-2f3cfb79561d-7980811886_thumb1200.jpg` | Art direction Len Peltier, design Steve Gerdes, photography Melodie McDaniel. |
| 8 | `album-08-crimson.jpg` | 1986 original 10-track album | `https://music.apple.com/jp/album/crimson/903270513` | `https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/93/82/35/93823581-bc38-2d16-8920-7d07c0f1b6c0/825646249701.jpg/1200x1200bb.jpg` | Rights holder Warner Music Japan. Verify photography and design credits against the original L-12650 liner notes. |
| 9 | `album-09-selling-england-by-the-pound.jpg` | 1973 original UK LP, Charisma CAS 1074 | `https://musicbrainz.org/release/b20fe9b2-ffdb-4765-8d1b-60e4c91577eb/cover-art` | `https://archive.org/download/mbid-b20fe9b2-ffdb-4765-8d1b-60e4c91577eb/mbid-b20fe9b2-ffdb-4765-8d1b-60e4c91577eb-2193822620_thumb1200.jpg` | Cover painting by Betty Swanwick. Cover Art Archive does not grant artwork copyright. |
| 10 | `album-10-good-kid-maad-city.jpg` | 2012 original US standard 12-track CD, B0017534-02 | `https://musicbrainz.org/release/5d850f71-e51e-44be-96c8-51cc305f3596/cover-art` | `https://archive.org/download/mbid-5d850f71-e51e-44be-96c8-51cc305f3596/mbid-5d850f71-e51e-44be-96c8-51cc305f3596-2818803920_thumb1200.jpg` | Aftermath, Interscope, and TDE. The family photograph needs extra copyright and likeness care. |

All 20 images are protected artwork. Source traceability and attribution do not
grant reuse permission. They may be used for local implementation and review,
but public deployment remains blocked until the artwork permission and
attribution gate is completed. Film row 8 also requires a human edition check
before deployment.
