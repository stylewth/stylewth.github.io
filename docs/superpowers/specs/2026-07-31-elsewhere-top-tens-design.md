# Elsewhere Top Tens Design

Date: 2026-07-31  
Owner: Tenghao Wang  
Status: Approved in conversation and written-spec review
Language: English UI with original-script titles where useful

## 1. Goal

Add two maintainable ranked collections to `/elsewhere/`:

- Movies Top 10
- Albums Top 10

The collections should feel like a personal archive rather than a conventional ranking grid. Ten covers rest in a shallow, overlapping fan. Focusing a card lifts it from the fan; clicking it opens a larger focus card. The focus card reveals title, rank, year, director or artist, and eventually a one-sentence personal review.

The feature must:

- preserve the current restrained editorial design;
- use standard-release artwork without recoloring, filters, or decorative cropping;
- keep the supplied ranking order;
- remain maintainable as local content rather than component markup;
- be usable without JavaScript and accessible with keyboard, pointer, and touch;
- avoid introducing a client framework or animation dependency.

## 2. Approved Experience

### Page structure

`/elsewhere/` becomes a wide content page with this order:

1. existing page introduction;
2. a `Top tens` collection stage;
3. `Movies / Albums` category tabs;
4. one active shallow fan in the shared stage, with Movies active by default;
5. the existing dated Elsewhere entries under a `Notes` heading.

Movies and Albums share one stage rather than forming two large consecutive fans. This keeps the page compact and gives the collection a single visual center.

When JavaScript is unavailable, both ranked lists render in normal document order and remain readable. JavaScript changes the two lists into a single tabbed stage only after the component initializes. Fan positioning, inactive-panel hiding, and tab-only styles are gated behind an explicit `data-enhanced` state set after initialization; they never apply to the fallback lists.

### Resting fan

Each ranked item is a semantic ordered-list item containing a button. The visual card consists of:

- standard-release cover;
- restrained `01`–`10` rank;
- a white information foot;
- year and creator in the information foot.

For Movies, the creator label is `Director`. For Albums, it is `Artist`. These labels are derived from `kind`; they are not repeated in every content record.

The ten cards overlap in a shallow arc:

- total rotation remains approximately `-26deg` to `+26deg`;
- vertical offsets form a shallow semicircle rather than a full 180-degree wheel;
- enough of every cover remains visible to identify and target it;
- center cards sit visually above adjacent cards;
- no card is randomly positioned.

At rest, overlapping cards partly conceal one another's information feet. Hover or keyboard focus moves the target card above its neighbors and lifts it enough to reveal the complete year and creator line. Focus order remains rank order from 1 to 10.

### Selected state

Clicking or activating a card opens one shared native `<dialog>`:

- the selected cover appears larger in the center;
- the original artwork remains unfiltered and keeps its source aspect ratio;
- the background fan remains visible through a restrained backdrop;
- a dark, translucent caption layer covers the lower portion of the enlarged artwork;
- the caption contains rank, title, optional original title, year, and director or artist;
- the optional review appears inside the same caption layer only when authored.

The user selected the caption-over-art treatment. It is intentionally more cinematic than a separate white caption foot. The overlay uses a single solid translucent color, not a gradient. Its contrast must meet WCAG AA.

If `review` is absent:

- no placeholder, divider, reserved blank line, or “Coming soon” text is rendered;
- the caption contracts to the metadata it actually contains.

The dialog closes through:

- the visible close control;
- `Escape`;
- activating the backdrop outside the focus card.

Closing restores focus to the triggering card. Reopening the active card does not create another dialog or duplicate event handlers.

### Category switching

`Movies` and `Albums` use accessible tab semantics:

- the tablist has an accessible label;
- the active control exposes `aria-selected="true"`;
- each tab references its panel;
- Left/Right Arrow changes the selected tab;
- Tab moves into the active fan;
- Movies is the deterministic initial category.

Switching category closes an open focus card before replacing the fan. Category state is local UI state and is not persisted to storage or a backend.

## 3. Responsive Behavior

| Width | Fan behavior | Focus-card behavior |
|---|---|---|
| Desktop, approximately 960 px content width | All 10 covers form one centered shallow arc | Centered dialog with enlarged artwork and bottom caption overlay |
| Tablet | Arc width and card size reduce while all ranks remain targetable | Centered dialog constrained by viewport height |
| Mobile | The shallow fan retains useful card size inside a horizontally scrollable stage; touch scrolling is native | Near-full-screen dialog; artwork and caption scroll vertically if needed |

The mobile layout does not compress ten covers into unreadable thumbnails. It keeps the same ranked order and shallow-arc geometry inside a stage wider than the viewport.

Touch has no hover-only requirement. One tap opens the selected card. The metadata required by the user is available inside the focus card even when the resting information foot cannot be fully exposed by hover.

## 4. Motion

Motion is restrained and functional:

- card hover/focus lift: approximately 160–200 ms;
- dialog cover entrance and caption reveal: approximately 180–220 ms;
- animate only `transform` and `opacity`;
- no spring physics, 3D tilt, autoplay, infinite loop, or scroll hijacking;
- no gradients.

Under `prefers-reduced-motion: reduce`, transforms and fades are removed. State changes remain immediate and fully understandable.

## 5. Content Architecture

Create a dedicated `favorites` collection. Do not add ranked favorites to the existing `elsewhere` collection:

- `elsewhere` records are dated notes ordered by publication date;
- `favorites` records are durable ranked data ordered by `kind` and `rank`.

Mixing the two would force unrelated date, rank, and card fields into one schema.

Recommended layout:

```text
src/
├── components/
│   └── elsewhere/
│       ├── FavoritesStage.astro
│       └── FavoriteFan.astro
├── content/
│   ├── elsewhere/
│   └── favorites/
│       ├── film/
│       └── album/
├── scripts/
│   └── favorites-stage.ts
└── pages/
    └── elsewhere/
        └── index.astro
```

`FavoritesStage.astro` owns category tabs and the shared focus dialog. `FavoriteFan.astro` owns one semantic ordered list and the deterministic fan layout. The page queries and sorts content, then passes explicit props into the components. The small TypeScript module owns only DOM-local state and dialog behavior.

No React, Vue, Svelte, animation package, remote API, CMS, or runtime data request is introduced.

## 6. Favorite Record Schema

Each favorite is one Markdown file with frontmatter:

```yaml
title: string
originalTitle: optional string
translationKey: stable string
kind: film | album
rank: integer from 1 through 10
year: four-digit integer
creator: string
cover: local image
coverAlt: non-empty string
coverSourceUrl: URL
coverCredit: optional string
editionNote: non-empty string
review: optional non-empty string, maximum 180 characters
lang: en
```

Rules:

- every locale has exactly 10 `film` and 10 `album` records;
- ranks for each kind are the complete set `1` through `10`;
- duplicate ranks fail the build;
- duplicate `translationKey` values within a locale fail the build;
- sorting never depends on filenames;
- `cover`, `coverAlt`, `coverSourceUrl`, and `editionNote` are required together;
- `review` is omitted when unwritten; an empty string is invalid;
- `creator` is the display-ready director or artist string;
- movie and album labels are derived from `kind`;
- current records use `lang: en`;
- future translations share `translationKey` and rank but may translate `review`.

Cross-record invariants belong in a reusable content assertion with unit coverage. Zod validates single-record shape; the page or content helper validates collection-wide rank completeness and uniqueness.

## 7. Approved Content Inventory

### Movies

| Rank | English title | Original title | Year | Director | Metadata source |
|---:|---|---|---:|---|---|
| 1 | *Taxi Driver* | — | 1976 | Martin Scorsese | [AFI Catalog](https://catalog.afi.com/Film/67969-TAXI-DRIVER) |
| 2 | *A Beautiful Mind* | — | 2001 | Ron Howard | [BFI](https://www.bfi.org.uk/film/ce58b0f7-d3e8-5234-a51a-cc680e1f52c6/a-beautiful-mind) |
| 3 | *Interstellar* | — | 2014 | Christopher Nolan | [BFI](https://www.bfi.org.uk/film/b07de850-8dd4-5fe1-a1e1-8d27fec041c1/interstellar) |
| 4 | *Eat Drink Man Woman* | 飲食男女 | 1994 | Ang Lee | [Taiwan Film and Audiovisual Institute](https://www.tfai.org.tw/en/program/movieDetail/2c9580827e58477e017e6c0ba607000f) |
| 5 | *Titanic* | — | 1997 | James Cameron | [Academy](https://www.oscars.org/collection-highlights/titanic?fid=62961) |
| 6 | *Burning* | 버닝 | 2018 | Lee Chang-dong | [KOFIC](https://www.koreanfilm.or.kr/eng/films/index/filmsView.jsp?category=ALL&mode=INDEX_FILMS_LIST&movieCd=20173202&pageIndex=1&pageRowSize=10&peopleCd=&s_genre=ALL&searchKeyword=Lee+Chang-dong&searchType=DIRECTOR&strMenuId=010401&userId=) |
| 7 | *Paprika* | パプリカ | 2006 | Satoshi Kon | [Sony Pictures](https://www.sonypictures.com/movies/paprika) |
| 8 | *In the Mood for Love* | 花樣年華 | 2000 | Wong Kar-wai | [Cannes](https://www.festival-cannes.com/en/f/in-the-mood-for-love-3/) |
| 9 | *Love Letter* | — | 1995 | Shunji Iwai | [BFI](https://www.bfi.org.uk/film/53bb7e81-d146-57bc-b77d-66e340b8a89d/love-letter) |
| 10 | *The Prestige* | — | 2006 | Christopher Nolan | [BFI](https://www.bfi.org.uk/film/5ed8d2f9-837b-5aa4-b8a9-dd4cb7368c50/the-prestige) |

`A Beautiful Mind` uses 2001 because its first limited theatrical release occurred in December 2001. `Titanic` refers specifically to James Cameron's 1997 film.

### Albums

| Rank | English title | Original title | Year | Artist | Metadata source |
|---:|---|---|---:|---|---|
| 1 | *The Dark Side of the Moon* | — | 1973 | Pink Floyd | [Pink Floyd](https://www.pinkfloyd.com/albums/the-dark-side-of-the-moon/) |
| 2 | *The Key* | — | 2013 | Eason Chan | [Apple Music](https://music.apple.com/us/album/the-key/1386714588) |
| 3 | *Heisei Fuuzoku - Japanese Manners* | 平成風俗 | 2007 | Sheena Ringo × Neko Saito | [Kronekodow](https://www.kronekodow.com/disc_detail.php?id=1316&r_cat_id=28) |
| 4 | *OK Computer* | — | 1997 | Radiohead | [Apple Music](https://music.apple.com/us/album/ok-computer/1097861387) |
| 5 | *Karuki Zahmen Kuri No Hana - Kalk Samen Chestnut Flower* | 加爾基 精液 栗ノ花 | 2003 | Sheena Ringo | [Universal Music Japan](https://www.universal-music.co.jp/sheena-ringo/products/toct-24942/) |
| 6 | *Inside the Cable Temple* | 冀西南林路行 | 2020 | Omnipotent Youth Society | [Apple Music](https://music.apple.com/us/album/%E5%86%80%E8%A5%BF%E5%8D%97%E6%9E%97%E8%B7%AF%E8%A1%8C/1545534900) |
| 7 | *Siamese Dream* | — | 1993 | The Smashing Pumpkins | [Apple Music](https://music.apple.com/us/album/siamese-dream/721207206) |
| 8 | *CRIMSON* | — | 1986 | Akina Nakamori | [Apple Music Japan](https://music.apple.com/jp/album/crimson/903270513) |
| 9 | *Selling England by the Pound* | — | 1973 | Genesis | [MusicBrainz release group](https://musicbrainz.org/release-group/1fadec3d-7451-32e8-9194-ad7e5312cb9b) |
| 10 | *good kid, m.A.A.d city* | — | 2012 | Kendrick Lamar | [Apple Music](https://music.apple.com/us/album/good-kid-m-a-a-d-city/1471263898) |

Use the original standard edition for every album. Do not use anniversary, remaster, deluxe, expanded, or alternate-cover editions. Preserve the collaborative credit for *Heisei Fuuzoku - Japanese Manners* and the all-caps styling of *CRIMSON*.

## 8. Cover Asset Rules

Implementation must source the standard-release cover for every item:

- original theatrical-release main poster from the film's production territory for films;
- original standard-edition front cover for albums;
- no recoloring, filters, blend modes, AI imitation, or decorative crop;
- no hotlinking;
- local source files use clear English filenames;
- Astro produces responsive derivatives and explicit dimensions;
- movie posters retain portrait proportion;
- album covers retain square proportion;
- `object-fit: contain` is used whenever a container and source ratio differ.

Every record stores the page from which the exact chosen artwork was identified. `editionNote` records the territory and edition, such as `original US theatrical one-sheet`, `original Japanese theatrical poster`, or `1973 standard LP front cover`. `coverSourceUrl` documents provenance; it does not itself establish permission. Before public deployment, each asset's permitted use and any attribution requirement must be checked. A required credit is stored in `coverCredit` and rendered in a compact sources note or associated accessible detail.

Artwork permission and attribution review is a deployment gate. The feature is not considered publication-ready if an image has no traceable source, lacks an edition/territory note, or requires an unfulfilled attribution. Generated lookalikes are not an acceptable fallback for missing rights.

## 9. Accessibility

- Both ranked collections are semantic `<ol>` elements.
- Every card trigger is a real button with a useful accessible name containing rank and title.
- Cover `alt` text identifies the work and edition without repeating nearby visible metadata verbatim.
- Visible focus is never represented by movement alone.
- The fan's visual stacking does not change DOM or reading order.
- Category tabs and panels expose correct names and selection state.
- The native dialog has an accessible name, visible close button, focus containment, and focus restoration.
- The enlarged caption text meets WCAG AA against its dark overlay.
- Dialog content remains reachable at 200% zoom and on a 390 px viewport.
- Reduced-motion preferences remove all non-essential transforms and transitions.
- With CSS positioning disabled, the ordered lists remain coherent.
- With JavaScript disabled, both lists and their complete metadata remain readable; only tabs and enlargement are absent.

## 10. Performance

- The page remains statically rendered.
- Only the local favorites component script is shipped to `/elsewhere/`.
- No client framework is hydrated.
- Resting thumbnails use responsive image sizes appropriate to their rendered card width.
- The larger focus image is loaded only when selected or uses an already generated appropriately sized source.
- Images below the initial viewport are lazy-loaded.
- Intrinsic dimensions prevent layout shift.
- Switching category does not refetch assets or call a remote API.
- The 20 source covers do not block the academic homepage.

## 11. Testing and Acceptance

### Data

- valid records produce exactly 10 films and 10 albums;
- missing or duplicate ranks fail;
- an empty review fails schema validation;
- a missing cover source fails;
- the approved rank order and metadata appear in the built page.

### Static output

- `/elsewhere/` contains both semantic ordered lists;
- Movies is the enhanced default tab;
- existing dated notes remain under `Notes`;
- no review placeholder is emitted for the initial 20 records;
- no remote image URL is used as an `<img>` source;
- client JavaScript is scoped to this route and component.

### Interaction

- hover and focus raise the intended card without reordering the DOM;
- tabs work by click and keyboard;
- activating a card opens the correct title, cover, year, and creator;
- a record with a review shows it inside the bottom overlay;
- a record without a review shows no empty review region;
- close button, backdrop, and `Escape` close the dialog;
- closing restores focus to the trigger;
- switching tabs closes an open dialog;
- repeated opening does not duplicate handlers.

### Visual and responsive

- inspect at 390, 768, and 1440 px;
- no page-level horizontal overflow;
- mobile fan scroll remains discoverable and touch-operable;
- movie posters and album covers preserve their respective ratios;
- standard artwork is not filtered, recolored, or cropped;
- overlay text remains legible;
- reduced-motion mode removes transforms;
- browser console contains no errors.

## 12. Out of Scope

- authored reviews in this iteration;
- drag physics or inertial card throwing;
- 3D card tilt, card flipping, or WebGL;
- autoplay carousel behavior;
- music or trailer playback;
- ratings, scores, likes, or public comments;
- a CMS or in-browser ranking editor;
- fetching metadata or artwork from a runtime API;
- automatic ranking changes;
- animated character or particle implementation.

The data and component boundaries leave room for later page-local character or particle work without coupling those systems to favorite records.
