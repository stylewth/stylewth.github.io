# Home Research Scroll Traversal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rejected one-time layered entrance with a visually matched scene in which one white rabbit moves left to right through three physical glass panes and progressively becomes a point-based predictive representation under direct scroll control.

**Architecture:** A hard visual gate produces scene-matched raster layers before motion code changes. A pure geometry module maps the marked rabbit's viewport visibility to normalized progress; a small custom element coalesces passive scroll and resize signals into one animation-frame update. Component CSS uses the same percentage both to move the subject and to reveal three lightweight SVG-pattern point layers through the rabbit PNG's alpha mask, so the rabbit exits in a visibly different predictive state without canvas, WebGL, a particle system, or a generated point-cloud PNG. The subject remains clipped to the base image's inner aperture, transparent glass assets supply material, and the base ring is the natural occluder.

**Tech Stack:** Astro 7, TypeScript 6, Vitest 4 with happy-dom, Astro image pipeline, component-scoped CSS, Codex in-app Browser, Lighthouse CLI, imagegen for all generated or edited raster assets.

---

## File map

| File | Responsibility |
|---|---|
| `src/assets/images/research-traversal-base.png` | Environment and rear apparatus with no rabbit or visible CSS-drawn panes |
| `src/assets/images/research-traversal-rabbit.png` | Tight transparent crop of the horizontal white rabbit, matched to the master scene |
| `src/assets/images/research-traversal-pane-1.png` | Transparent photographic material for the first glass pane |
| `src/assets/images/research-traversal-pane-2.png` | Transparent photographic material for the second glass pane |
| `src/assets/images/research-traversal-pane-3.png` | Transparent photographic material for the third glass pane |
| `src/scripts/research-traversal-progress.ts` | Pure viewport-geometry to progress calculation and percentage formatting |
| `src/scripts/research-traversal-progress.test.ts` | Boundary, midpoint, clamp, and invalid-geometry tests |
| `src/scripts/research-traversal.ts` | Passive scroll/resize controller and cleanup |
| `src/scripts/research-traversal.test.ts` | Coalescing, forward/reverse, reduced-motion, and cleanup tests |
| `src/components/home/ResearchInterests.astro` | Semantic copy, four scene depth groups, aperture-clipped travel track, photographic-to-point transformation, responsive layout, and reduced-motion static state |
| `src/pages/index.astro` | Explicit image imports and props for the research scene |
| `tests/source-contracts.test.ts` | Source asset, alpha, component-boundary, and prohibited-old-implementation contracts |
| `tests/site-output.test.ts` | Production HTML layer order, optimized formats, lazy loading, and script count |

> **Post-verification timing correction:** Browser review showed that section-based boundaries advanced the animation while mobile text was visible but the rabbit was still below the viewport. The final implementation supersedes the Task 2/3 geometry examples below: progress is `0` when the marked rabbit's top reaches the viewport bottom and `1` when its bottom reaches the viewport top. The controller reads `[data-research-rabbit]`, not the component host rectangle.

### Task 1: Pass the photographic asset gate

**Files:**
- Create: `src/assets/images/research-traversal-base.png`
- Create: `src/assets/images/research-traversal-rabbit.png`
- Create: `src/assets/images/research-traversal-pane-1.png`
- Create: `src/assets/images/research-traversal-pane-2.png`
- Create: `src/assets/images/research-traversal-pane-3.png`
- Modify: `tests/source-contracts.test.ts`
- Reference: `docs/superpowers/assets/home-research-motion-preview.png`

- [x] **Step 1: Write the failing asset contract**

Replace the current two-layer research asset test with a pixel-level alpha helper and expectations for the five approved files. The independent foreground file must not exist:

```ts
async function pngAlphaRange(path: string): Promise<{ min: number; max: number }> {
  const metadata = await sharp(path).metadata();
  expect(metadata.format, path).toBe('png');
  expect(metadata.hasAlpha, path).toBe(true);

  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let min = 255;
  let max = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    min = Math.min(min, data[index]);
    max = Math.max(max, data[index]);
  }
  return { min, max };
}

it('stores the approved research traversal as matched photographic layers', async () => {
  const imageRoot = join(projectRoot, 'src', 'assets', 'images');
  const required = [
    'research-traversal-base.png',
    'research-traversal-rabbit.png',
    'research-traversal-pane-1.png',
    'research-traversal-pane-2.png',
    'research-traversal-pane-3.png',
  ];

  required.forEach((name) => {
    const path = join(imageRoot, name);
    expect(existsSync(path), name).toBe(true);
    expect(readFileSync(path).byteLength, name).toBeGreaterThan(1_000);
  });

  const transparent = required.slice(1);
  for (const name of transparent) {
    const { min, max } = await pngAlphaRange(join(imageRoot, name));
    expect(min, name).toBeLessThan(255);
    expect(max, name).toBeGreaterThan(0);
  }

  const rabbit = await sharp(join(imageRoot, 'research-traversal-rabbit.png')).metadata();
  expect(rabbit.width, 'research-traversal-rabbit.png width').toBeGreaterThan(rabbit.height ?? 0);
  expect(existsSync(join(imageRoot, 'research-traversal-foreground.png'))).toBe(false);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts -t "matched photographic layers"
```

Expected: FAIL because the four required transparent layers do not exist yet.

- [x] **Step 3: Generate or edit the five raster layers with imagegen**

Read and use the `imagegen` skill. Inspect the approved master first. Use the master as the reference for every request; do not introduce stock photography.

Base prompt:

```text
Edit the referenced approved editorial research scene. Preserve the exact warm bone palette, soft natural light, ground perspective, left-side negative space, circular black scientific apparatus, camera angle, and canvas composition. Remove the rabbit and remove the three glass panes while reconstructing the background behind them. Keep the rear apparatus geometry. Output a clean photographic base with no text, no markers, no extra objects, no borders, and no checkerboard.
```

Rabbit prompt:

```text
From the same referenced scene, reconstruct the exact single white rabbit as a tight horizontal side-profile subject moving to the right. Match the scene's light direction, warm color temperature, scale, grain, perspective, fur softness, and contact shading. Output only the complete rabbit with genuine transparent alpha; no floor, shadow rectangle, apparatus, pane, text, border, or checkerboard.
```

For each pane, change only the ordinal and position in this prompt:

```text
From the same referenced scene, extract the [first/second/third] physical observation pane as a separate transparent photographic layer. Preserve its exact perspective, faint tint, edge thickness, reflection, surface variation, and subtle optical material. Output only that pane with genuine transparent alpha; no rabbit, apparatus frame, background, text, UI rectangle, decorative markers, or checkerboard.
```

Each transparent layer may receive further targeted retries. After every attempt, record both the pixel-alpha audit and the crop/canvas audit. If attempts fail consecutively, keep rewriting the prompt specifically around the observed failure and retry that layer; do not create a mask, threshold cutout, stock replacement, CSS material, or other fabricated fallback.

The user approved the base image's existing circular ring as the natural occluder. Do not generate, extract, or accept `research-traversal-foreground.png`; the moving subject will be clipped to an ellipse matching the apparatus aperture, with refractions and pane overlays above it.

- [x] **Step 4: Verify file properties and make the focused test GREEN**

Inspect every layer with `view_image`. Run this exact alpha audit from the repository root; it fails when a transparent layer is fully opaque or fully empty:

```powershell
node --input-type=module -e "import sharp from 'sharp'; const root='src/assets/images/'; const files=['research-traversal-rabbit.png','research-traversal-pane-1.png','research-traversal-pane-2.png','research-traversal-pane-3.png']; for (const name of files) { const { data, info } = await sharp(root + name).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); let min=255,max=0; for (let index=3; index<data.length; index+=info.channels) { min=Math.min(min,data[index]); max=Math.max(max,data[index]); } console.log(name, info.width, info.height, info.channels, min, max); if (min === 255 || max === 0) process.exitCode=1; }"
```

Then run:

```powershell
npx vitest run tests/source-contracts.test.ts -t "matched photographic layers"
```

Expected: PASS. The rabbit is wider than tall; rabbit and panes have genuine pixel alpha; `research-traversal-foreground.png` is absent.

- [x] **Step 5: Build a temporary static composite and obtain user approval**

Create an ignored visual-companion HTML screen under `.superpowers/brainstorm/` with the base, aperture-clipped rabbit, refraction regions, and three pane overlays absolutely aligned in that four-group depth order. Show desktop and 390-pixel mobile crops side by side. Do not add motion, an independent foreground image, or CSS-drawn glass material. The user must explicitly approve all of these before proceeding:

- rabbit reads as part of the scene rather than a pasted cutout;
- three panes read as physical glass without CSS borders;
- apparatus geometry and left title space match the approved master;
- mobile crop preserves subject and title separation.

If rejected, regenerate only the rejected layer and repeat this step. Do not continue to Task 2 without approval.

- [x] **Step 6: Commit the approved layers and contract**

```powershell
git add src/assets/images/research-traversal-*.png tests/source-contracts.test.ts
git commit -m "assets: rebuild matched research traversal scene"
```

### Task 2: Implement and test pure scroll-progress geometry

**Files:**
- Create: `src/scripts/research-traversal-progress.ts`
- Create: `src/scripts/research-traversal-progress.test.ts`

- [x] **Step 1: Write the failing geometry tests**

```ts
import { describe, expect, it } from 'vitest';
import { calculateTraversalProgress, formatProgressPercent } from './research-traversal-progress';

describe('calculateTraversalProgress', () => {
  it('maps the approved viewport boundaries to zero, midpoint, and one', () => {
    expect(calculateTraversalProgress({ top: 850, bottom: 1450, viewportHeight: 1000 })).toBe(0);
    expect(calculateTraversalProgress({ top: 250, bottom: 850, viewportHeight: 1000 })).toBe(0.5);
    expect(calculateTraversalProgress({ top: -350, bottom: 250, viewportHeight: 1000 })).toBe(1);
  });

  it('clamps progress before and after the traversal range', () => {
    expect(calculateTraversalProgress({ top: 1000, bottom: 1600, viewportHeight: 1000 })).toBe(0);
    expect(calculateTraversalProgress({ top: -500, bottom: 100, viewportHeight: 1000 })).toBe(1);
  });

  it('rejects invalid viewport and section geometry', () => {
    expect(() => calculateTraversalProgress({ top: 0, bottom: 1, viewportHeight: 0 })).toThrow(RangeError);
    expect(() => calculateTraversalProgress({ top: 10, bottom: 10, viewportHeight: 1000 })).toThrow(RangeError);
  });

  it('formats normalized progress as a stable CSS percentage', () => {
    expect(formatProgressPercent(0)).toBe('0%');
    expect(formatProgressPercent(0.423456)).toBe('42.346%');
    expect(formatProgressPercent(1)).toBe('100%');
  });
});
```

- [x] **Step 2: Run the test and verify RED**

```powershell
npx vitest run src/scripts/research-traversal-progress.test.ts
```

Expected: FAIL because `research-traversal-progress.ts` does not exist.

- [x] **Step 3: Implement the pure geometry module**

```ts
export interface TraversalGeometry {
  top: number;
  bottom: number;
  viewportHeight: number;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function calculateTraversalProgress({
  top,
  bottom,
  viewportHeight,
}: TraversalGeometry): number {
  const sectionHeight = bottom - top;
  if (viewportHeight <= 0 || sectionHeight <= 0) {
    throw new RangeError('Traversal geometry must have positive dimensions');
  }

  const start = viewportHeight * 0.85;
  const end = viewportHeight * 0.25;
  return clamp((start - top) / (sectionHeight + start - end));
}

export function formatProgressPercent(progress: number): string {
  const percent = Math.round(clamp(progress) * 100_000) / 1_000;
  return `${percent}%`;
}
```

- [x] **Step 4: Run the focused test and verify GREEN**

```powershell
npx vitest run src/scripts/research-traversal-progress.test.ts
```

Expected: 4 tests pass.

- [x] **Step 5: Commit**

```powershell
git add src/scripts/research-traversal-progress.ts src/scripts/research-traversal-progress.test.ts
git commit -m "feat: calculate research traversal progress"
```

### Task 3: Replace the one-time observer with a coalesced scroll controller

**Files:**
- Create: `src/scripts/research-traversal.ts`
- Create: `src/scripts/research-traversal.test.ts`
- Delete: `src/scripts/research-motion.ts`
- Delete: `src/scripts/research-motion.test.ts`

- [x] **Step 1: Write the failing controller tests**

Create this complete happy-dom suite:

```ts
// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RectState = { top: number; bottom: number };
type RectSetter = (next: RectState) => void;

const rectSetters = new WeakMap<HTMLElement, RectSetter>();
let pendingFrame: FrameRequestCallback | undefined;
let nextFrameId = 0;
let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

function toDomRect({ top, bottom }: RectState): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    right: 100,
    bottom,
    left: 0,
    width: 100,
    height: bottom - top,
    toJSON: () => ({}),
  };
}

async function mount(initialRect: RectState): Promise<HTMLElement> {
  await import('./research-traversal');
  const host = document.createElement('research-traversal');
  let rect = initialRect;
  Object.defineProperty(host, 'getBoundingClientRect', {
    configurable: true,
    value: () => toDomRect(rect),
  });
  rectSetters.set(host, (next) => { rect = next; });
  document.body.append(host);
  return host;
}

function setRect(host: HTMLElement, next: RectState): void {
  const set = rectSetters.get(host);
  if (!set) throw new Error('Host was not mounted by this suite');
  set(next);
}

function flushFrame(): void {
  const callback = pendingFrame;
  pendingFrame = undefined;
  if (!callback) throw new Error('No animation frame is pending');
  callback(0);
}

describe('research traversal controller', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.replaceChildren();
    pendingFrame = undefined;
    nextFrameId = 0;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      pendingFrame = callback;
      nextFrameId += 1;
      return nextFrameId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      if (id === nextFrameId) pendingFrame = undefined;
    }));
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

it('writes progress from current geometry and reverses with upward scroll', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('0%');

  setRect(host, { top: -350, bottom: 250 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('100%');

  setRect(host, { top: 250, bottom: 850 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('50%');
});

it('coalesces repeated scroll signals into one frame', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  flushFrame();
  vi.mocked(requestAnimationFrame).mockClear();
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('scroll'));
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  host.remove();
});

it('keeps the static middle state under reduced motion', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)));
  const host = await mount({ top: 250, bottom: 850 });
  expect(host.hasAttribute('data-traversal-ready')).toBe(false);
  expect(host.style.getPropertyValue('--research-progress')).toBe('');
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('removes listeners and cancels pending work on disconnect', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  host.remove();
  expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
});
});
```

- [x] **Step 2: Run the controller test and verify RED**

```powershell
npx vitest run src/scripts/research-traversal.test.ts
```

Expected: FAIL because `research-traversal.ts` does not exist.

- [x] **Step 3: Implement the controller**

```ts
import { calculateTraversalProgress, formatProgressPercent } from './research-traversal-progress';

const tagName = 'research-traversal';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

class ResearchTraversalElement extends HTMLElement {
  #frame = 0;

  #schedule = (): void => {
    if (this.#frame) return;
    this.#frame = window.requestAnimationFrame(() => {
      this.#frame = 0;
      const rect = this.getBoundingClientRect();
      const progress = calculateTraversalProgress({
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
      });
      this.style.setProperty('--research-progress', formatProgressPercent(progress));
      this.setAttribute('data-traversal-ready', '');
    });
  };

  connectedCallback(): void {
    if (window.matchMedia(reducedMotionQuery).matches) return;
    window.addEventListener('scroll', this.#schedule, { passive: true });
    window.addEventListener('resize', this.#schedule);
    this.#schedule();
  }

  disconnectedCallback(): void {
    window.removeEventListener('scroll', this.#schedule);
    window.removeEventListener('resize', this.#schedule);
    if (this.#frame) window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.removeAttribute('data-traversal-ready');
    this.style.removeProperty('--research-progress');
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, ResearchTraversalElement);
}

export {};
```

- [x] **Step 4: Run focused and complete source tests**

```powershell
npx vitest run src/scripts/research-traversal.test.ts src/scripts/research-traversal-progress.test.ts
npm run test
```

Expected: focused suites pass; complete source suite passes after deleting the obsolete motion suite.

- [x] **Step 5: Commit**

```powershell
git add src/scripts/research-traversal.ts src/scripts/research-traversal.test.ts src/scripts/research-traversal-progress.ts src/scripts/research-traversal-progress.test.ts src/scripts/research-motion.ts src/scripts/research-motion.test.ts
git commit -m "feat: drive research traversal from scroll"
```

### Task 4: Rebuild the research component with depth layers and representation morphing

**Files:**
- Modify: `src/components/home/ResearchInterests.astro`
- Modify: `src/pages/index.astro`
- Modify: `tests/source-contracts.test.ts`
- Test: `src/scripts/research-traversal.test.ts`

- [x] **Step 1: Replace obsolete component contracts with failing traversal contracts**

Update the research component contract to require:

```ts
expect(indexPage).toContain('research-traversal-base.png');
expect(indexPage).toContain('research-traversal-rabbit.png');
expect(indexPage.match(/research-traversal-pane-[123]\.png/g) ?? []).toHaveLength(3);
expect(indexPage).not.toContain('research-traversal-foreground.png');
expect(research).toContain('<research-traversal');
expect(research).toContain("import '../../scripts/research-traversal'");
expect(research).toContain("const paneNames = ['one', 'two', 'three'] as const;");
expect(research.match(/data-research-pane/g) ?? []).toHaveLength(1);
expect(research.match(/data-research-refraction/g) ?? []).toHaveLength(1);
expect(research).not.toContain('data-research-foreground');
expect(research).toContain('clip-path: ellipse(');
expect(research).toContain('left: var(--research-progress)');
expect(research).toContain('data-research-photo');
expect(research).toContain("const pointDepths = ['far', 'middle', 'near'] as const;");
expect(research).toContain('data-research-point-layer');
expect(research).toContain('--research-rabbit-mask');
expect(research).toContain('mask-image: var(--research-rabbit-mask)');
expect(research).toContain('calc(100% - var(--research-progress))');
expect(research).toContain('calc(90% - var(--research-progress))');
expect(research).not.toContain('<canvas');
expect(research).not.toContain('requestAnimationFrame(draw)');
expect(indexPage).not.toMatch(/point[-_]cloud|pointcloud/i);
expect(research).not.toContain('<research-motion');
expect(research).not.toContain('data-motion-entered');
expect(research).not.toContain('research-field__slice');
expect(research).not.toMatch(/\.research-field__pane\s*\{[^}]*border\s*:/);
expect(research).not.toMatch(/\btransition(?:-[a-z-]+)?\s*:/);
expect(research).not.toMatch(/@keyframes|\banimation\s*:/);
expect(indexPage).toMatch(
  /<ResearchInterests[\s\S]*?copy=\{en\.research\}[\s\S]*?baseImage=\{researchBaseImage\}[\s\S]*?subjectImage=\{researchSubjectImage\}[\s\S]*?paneImages=\{researchPaneImages\}[\s\S]*?\/>/,
);
expect(research).toContain('paneImages: readonly [ImageMetadata, ImageMetadata, ImageMetadata]');
expect(research).not.toContain('foregroundImage');
```

- [x] **Step 2: Run the focused source contract and verify RED**

```powershell
npx vitest run tests/source-contracts.test.ts -t "research scene"
```

Expected: FAIL because the page still imports old assets and the component still renders CSS slices.

- [x] **Step 3: Update the page imports and explicit props**

In `src/pages/index.astro`, replace the old research image imports with these exact imports and tuple:

```ts
import researchBaseImage from '../assets/images/research-traversal-base.png';
import researchSubjectImage from '../assets/images/research-traversal-rabbit.png';
import researchPane1Image from '../assets/images/research-traversal-pane-1.png';
import researchPane2Image from '../assets/images/research-traversal-pane-2.png';
import researchPane3Image from '../assets/images/research-traversal-pane-3.png';

const researchPaneImages = [researchPane1Image, researchPane2Image, researchPane3Image] as const;
```

Pass:

```astro
<ResearchInterests
  copy={en.research}
  baseImage={researchBaseImage}
  subjectImage={researchSubjectImage}
  paneImages={researchPaneImages}
/>
```

Use the exact names `researchBaseImage`, `researchSubjectImage`, `researchPane1Image`, `researchPane2Image`, and `researchPane3Image`. Do not import or pass an independent foreground image.

- [x] **Step 4: Replace the component markup**

Use these props and depth groups:

```astro
interface Props {
  copy: ResearchCopy;
  baseImage: ImageMetadata;
  subjectImage: ImageMetadata;
  paneImages: readonly [ImageMetadata, ImageMetadata, ImageMetadata];
}

const { copy, baseImage, subjectImage, paneImages } = Astro.props;
const paneNames = ['one', 'two', 'three'] as const;
const pointDepths = ['far', 'middle', 'near'] as const;
---

<research-traversal class="research-traversal" data-research-traversal>
  <section id="research-interests" class="research-field" aria-labelledby="research-interests-title">
    <div class="research-field__content shell">
      <p class="eyebrow">{copy.eyebrow}</p>
      <h2 id="research-interests-title" class="research-field__statement">{copy.statement}</h2>
      <p class="research-field__description">{copy.description}</p>
      <ul class="interest-list" aria-label={copy.interestsLabel}>
        {copy.interests.map((interest) => <li>{interest}</li>)}
      </ul>
    </div>

    <div class="research-field__scene" aria-hidden="true">
      <div class="research-field__base" data-research-base>
        <Picture src={baseImage} formats={['avif', 'webp']} fallbackFormat="jpeg"
          widths={[768, 1280, 1920]} sizes="100vw" alt="" loading="lazy" />
      </div>

      <div class="research-field__subject-layer" data-research-subject data-research-aperture>
        <div class="research-field__travel-track">
          <div class="research-field__rabbit">
            <div class="research-field__rabbit-photo" data-research-photo>
              <Picture src={subjectImage} formats={['avif', 'webp']} fallbackFormat="png"
                widths={[192, 320]} sizes="(max-width: 48rem) 7rem, 10rem"
                alt="" loading="lazy" />
            </div>
            <div class="research-field__rabbit-points"
              style={`--research-rabbit-mask: url(&quot;${subjectImage.src}&quot;)`}>
              {pointDepths.map((depth) => (
                <span class={`research-field__point-depth research-field__point-depth--${depth}`}
                  data-research-point-layer></span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {paneNames.map((name) => (
        <div class={`research-field__refraction research-field__refraction--${name}`}
          data-research-refraction>
          <div class="research-field__travel-track research-field__travel-track--refracted">
            <div class="research-field__rabbit">
              <div class="research-field__rabbit-photo" data-research-photo>
                <Picture src={subjectImage} formats={['avif', 'webp']} fallbackFormat="png"
                  widths={[192, 320]} sizes="(max-width: 48rem) 7rem, 10rem"
                  alt="" loading="lazy" />
              </div>
              <div class="research-field__rabbit-points"
                style={`--research-rabbit-mask: url(&quot;${subjectImage.src}&quot;)`}>
                {pointDepths.map((depth) => (
                  <span class={`research-field__point-depth research-field__point-depth--${depth}`}
                    data-research-point-layer></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {paneImages.map((pane, index) => (
        <div class={`research-field__pane research-field__pane--${paneNames[index]}`}
          data-research-pane>
          <Picture src={pane} formats={['avif', 'webp']} fallbackFormat="png"
            widths={[96, 160]} sizes="8vw" alt="" loading="lazy" />
        </div>
      ))}

    </div>
  </section>
</research-traversal>

<script>
  import '../../scripts/research-traversal';
</script>
```

- [x] **Step 5: Replace the component CSS with scroll-travel layout**

Implement these exact structural rules. If the static composite from Task 1 cannot align at these coordinates, return to the asset gate and regenerate the misaligned layer instead of compensating with CSS effects:

```css
.research-traversal { --research-progress: 70%; display: block; }
.research-field { position: relative; overflow: hidden; min-height: 42rem; background: var(--color-bone); isolation: isolate; }
.research-field__scene { position: absolute; inset: 0; z-index: 0; }
.research-field__scene :global(picture), .research-field__scene :global(img) { display: block; }
.research-field__base { position: absolute; inset: 0; width: 100%; height: 100%; }
.research-field__base :global(picture), .research-field__base :global(img) { width: 100%; height: 100%; }
.research-field__base :global(img) { object-fit: cover; object-position: center; }
.research-field__subject-layer, .research-field__refraction { position: absolute; inset: 0; }
.research-field__subject-layer { z-index: 2; clip-path: ellipse(18% 46% at 72% 49%); overflow: hidden; }
.research-field__travel-track { position: absolute; top: 46%; left: 60%; width: 27%; height: 20%; }
.research-field__rabbit { position: absolute; top: 50%; left: var(--research-progress); width: clamp(7rem, 10vw, 10rem); aspect-ratio: 3 / 2; transform: translate(-50%, -50%); }
.research-field__rabbit-photo, .research-field__rabbit-points, .research-field__point-depth { position: absolute; inset: 0; }
.research-field__rabbit-photo { clip-path: inset(0 var(--research-progress) 0 0); }
.research-field__rabbit-photo :global(picture), .research-field__rabbit-photo :global(img) { width: 100%; height: 100%; }
.research-field__rabbit-photo :global(img) { object-fit: contain; }
.research-field__rabbit-points { clip-path: inset(0 0 0 calc(100% - var(--research-progress))); }
.research-field__point-depth {
  background-repeat: repeat;
  -webkit-mask-image: var(--research-rabbit-mask);
  mask-image: var(--research-rabbit-mask);
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
}
.research-field__point-depth--far {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23'%3E%3Ccircle cx='4' cy='6' r='1.1' fill='%23365062'/%3E%3Ccircle cx='17' cy='15' r='.75' fill='%23365062'/%3E%3C/svg%3E");
  background-size: 23px 23px;
  opacity: .58;
  transform: translate(-1.5px, -1px);
}
.research-field__point-depth--middle {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='31' height='31' viewBox='0 0 31 31'%3E%3Cellipse cx='7' cy='9' rx='1.35' ry='1' fill='%236ba9b6'/%3E%3Ccircle cx='23' cy='20' r='1.05' fill='%236ba9b6'/%3E%3C/svg%3E");
  background-size: 31px 31px;
  opacity: .76;
  transform: translate(.5px, 0);
}
.research-field__point-depth--near {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='43' height='43' viewBox='0 0 43 43'%3E%3Cellipse cx='10' cy='11' rx='2.2' ry='1.45' fill='%23e6dfd1'/%3E%3Ccircle cx='31' cy='29' r='1.7' fill='%23d3a169'/%3E%3Ccircle cx='35' cy='8' r='.9' fill='%23e6dfd1'/%3E%3C/svg%3E");
  background-size: 43px 43px;
  opacity: .9;
  transform: translate(1.5px, .75px);
}
.research-field__refraction { z-index: 3; pointer-events: none; }
.research-field__refraction--one { clip-path: inset(24% 29% 24% 66%); }
.research-field__refraction--two { clip-path: inset(24% 22% 24% 73%); }
.research-field__refraction--three { clip-path: inset(24% 15% 24% 80%); }
.research-field__travel-track--refracted .research-field__rabbit { opacity: .82; transform: translate(calc(-50% + 2px), -50%); }
.research-field__travel-track--refracted .research-field__rabbit-photo { clip-path: inset(0 calc(var(--research-progress) + 10%) 0 0); }
.research-field__travel-track--refracted .research-field__rabbit-points { clip-path: inset(0 0 0 calc(90% - var(--research-progress))); }
.research-field__pane { position: absolute; z-index: 4; top: 24%; width: 5%; height: 52%; }
.research-field__pane--one { left: 66%; }
.research-field__pane--two { left: 73%; }
.research-field__pane--three { left: 80%; }
.research-field__pane :global(picture), .research-field__pane :global(img) { width: 100%; height: 100%; }
.research-field__pane :global(img) { object-fit: fill; }
.research-field__content { position: relative; z-index: 5; display: flex; min-height: 42rem; flex-direction: column; justify-content: center; padding-block: var(--space-section); }
.research-field__statement { max-width: 11ch; margin-block-end: 2rem; font-size: clamp(2.6rem, 6.1vw, 5.5rem); }
.research-field__description { max-width: 46ch; margin-block-end: 3rem; }
.interest-list { display: grid; max-width: 50rem; margin: 0; padding: 0; border-top: 1px solid var(--color-text); grid-template-columns: repeat(3, 1fr); list-style: none; }
.interest-list li { padding: 1rem 1rem 1rem 0; border-bottom: 1px solid var(--color-text); font-size: .88rem; font-weight: 600; }

@media (max-width: 48rem) {
  .research-field { display: grid; min-height: 0; }
  .research-field__content { order: 1; min-height: 0; padding-block: var(--space-section); }
  .research-field__scene { position: relative; inset: auto; order: 2; min-height: 24rem; }
  .research-field__base :global(img) { object-position: 70% center; }
  .research-field__subject-layer { clip-path: ellipse(26.5% 32% at 73% 49%); }
  .research-field__travel-track { top: 46%; left: 48%; width: 42%; height: 20%; }
  .research-field__rabbit { width: 7rem; }
  .research-field__refraction--one { clip-path: inset(22% 38% 22% 54%); }
  .research-field__refraction--two { clip-path: inset(22% 26% 22% 66%); }
  .research-field__refraction--three { clip-path: inset(22% 14% 22% 78%); }
  .research-field__pane { top: 22%; width: 8%; height: 56%; }
  .research-field__pane--one { left: 54%; }
  .research-field__pane--two { left: 66%; }
  .research-field__pane--three { left: 78%; }
  .interest-list { grid-template-columns: 1fr; }
}
```

Do not add any transition declaration. The mobile text remains in normal flow above the relative scene stage and is never absolutely overlaid on it.

In reduced motion, keep `--research-progress: 70%` and do not add transitions or animations.

- [x] **Step 6: Run source tests, Astro diagnostics, and inspect the static states**

```powershell
npx vitest run tests/source-contracts.test.ts
npm run check
```

Expected: source contracts pass; Astro reports 0 errors, 0 warnings, 0 hints. At `--research-progress: 0%` the rabbit is photographic; at `100%` it is point-based; with JavaScript disabled or reduced motion enabled, the static `70%` state is visible between panes two and three.

- [x] **Step 7: Commit**

```powershell
git add src/components/home/ResearchInterests.astro src/pages/index.astro tests/source-contracts.test.ts
git commit -m "feat: morph research rabbit into predictive state"
```

### Task 5: Update production-output contracts and remove rejected assets

**Files:**
- Modify: `tests/site-output.test.ts`
- Delete: `src/assets/images/research-world-model-base.png`
- Delete: `src/assets/images/research-world-model-rabbit-layer.png`

- [x] **Step 1: Write failing production-output expectations**

Replace the old layered-scene output test with assertions that:

```ts
const basePosition = html.indexOf('data-research-base');
const subjectPosition = html.indexOf('data-research-subject');
const refractionPosition = html.indexOf('data-research-refraction');
const panePosition = html.indexOf('data-research-pane');

const layerPositions = [basePosition, subjectPosition, refractionPosition, panePosition];
layerPositions.forEach((position) => expect(position).toBeGreaterThan(-1));
expect(layerPositions)
  .toEqual([...new Set(layerPositions)]
    .sort((a, b) => a - b));
expect(html.match(/data-research-refraction/g) ?? []).toHaveLength(3);
expect(html.match(/data-research-pane/g) ?? []).toHaveLength(3);
expect(html.match(/data-research-photo/g) ?? []).toHaveLength(4);
expect(html.match(/data-research-point-layer/g) ?? []).toHaveLength(12);
expect(html).toContain('research-traversal-base.');
expect(html).toContain('research-traversal-rabbit.');
expect(html).not.toContain('research-traversal-foreground.');
expect(html).not.toMatch(/point[-_]cloud|pointcloud/i);
expect(html).not.toContain('<canvas');
expect(html).not.toContain('data-research-foreground');
expect(html).not.toContain('data-motion-entered');
expect(html).not.toContain('research-field__slice');
```

Add these concrete checks for the eight scene pictures (base, subject, three refraction copies, and three panes):

```ts
const researchStart = html.indexOf('data-research-traversal');
const researchEnd = html.indexOf('</research-traversal>', researchStart);
expect(researchStart).toBeGreaterThan(-1);
expect(researchEnd).toBeGreaterThan(researchStart);

const researchHtml = html.slice(researchStart, researchEnd);
const scenePictures = researchHtml.match(/<picture>[\s\S]*?<\/picture>/g) ?? [];
expect(scenePictures).toHaveLength(8);
scenePictures.forEach((picture) => {
  expect(picture).toContain('type="image/avif"');
  expect(picture).toContain('type="image/webp"');
  expect(picture).toContain('loading="lazy"');
  expect(picture).toMatch(/<img [^>]*src="[^"]+\.(?:jpe?g|png)"/);
});
```

Keep the existing homepage executable-script assertion at exactly one and leave every unrelated route assertion unchanged.

- [x] **Step 2: Run the site-output test and verify RED**

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts -t "research"
```

Expected: FAIL until the old output assertions and old source files are removed.

- [x] **Step 3: Delete the rejected assets and finish the output contract**

Delete only:

```text
src/assets/images/research-world-model-base.png
src/assets/images/research-world-model-rabbit-layer.png
```

Do not delete the approved master under `docs/superpowers/assets/`.

- [x] **Step 4: Run the full build**

```powershell
npm run build
```

Expected: Astro 0 diagnostics, all source tests pass, site build completes, all site-output tests pass.

- [x] **Step 5: Commit**

```powershell
git add tests/site-output.test.ts src/assets/images
git commit -m "test: enforce research traversal output"
```

### Task 6: Browser, accessibility, and performance verification

**Files:**
- Create ignored artifacts only under: `.superpowers/qa/`
- Modify tracked files only if a failing verification requires a test-first correction

- [x] **Step 1: Start the production preview and open the homepage at the top**

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

Use the in-app Browser skill. Open `/`, not `/#research-interests`. Keep the browser visible for the final user review.

- [x] **Step 2: Verify actual forward, pause, and reverse motion**

At 1440×900, use browser scrolling rather than page-scope `scrollTo`. Capture the subject's bounding box and `--research-progress` at:

- before the section enters: `0%`;
- halfway through: between `48%` and `52%`;
- after all panes: `100%`;
- after scrolling back to halfway: between `48%` and `52%` again.

Pause for 500 ms at halfway and confirm the bounding box does not move. Confirm there are no console warnings or errors.

- [x] **Step 3: Verify responsive and static modes**

Repeat visual inspection at 768×900, 390×844, and 320×720. At each width verify no horizontal overflow and no text-scene collision. On mobile, confirm the text block is above the scene stage.

Emulate `prefers-reduced-motion: reduce` and disable JavaScript separately. Both must show the static 70% state with complete copy and scene.

- [x] **Step 4: Measure script and scene budgets**

After the final build, run:

```powershell
$html = Get-Content -LiteralPath 'dist\index.html' -Raw
$module = [regex]::Match($html, '<script type="module">(.*?)</script>').Groups[1].Value
$bytes = [Text.Encoding]::UTF8.GetBytes($module)
$stream = New-Object IO.MemoryStream
$gzip = New-Object IO.Compression.GZipStream($stream,[IO.Compression.CompressionLevel]::Optimal,$true)
$gzip.Write($bytes,0,$bytes.Length); $gzip.Dispose()
"MOTION_GZIP=$($stream.ToArray().Length)"

$scene = Get-ChildItem -LiteralPath 'dist\_astro' -File |
  Where-Object { $_.Name -like 'research-traversal*.avif' } |
  Group-Object { ($_.Name -split '\.')[0] } |
  ForEach-Object { ($_.Group | Measure-Object Length -Maximum).Maximum } |
  Measure-Object -Sum
"SCENE_MAX_AVIF=$($scene.Sum)"
```

Expected: `MOTION_GZIP` ≤ 2048 bytes and `SCENE_MAX_AVIF` ≤ 307200 bytes.

- [x] **Step 5: Run final mobile Lighthouse**

```powershell
npx --offline --cache .npm-cache lighthouse http://127.0.0.1:4321/ `
  --only-categories=performance --form-factor=mobile --screenEmulation.mobile `
  --throttling-method=simulate --output=json `
  --output-path=.superpowers/qa/research-traversal-lighthouse.json `
  --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet
```

Read the report even if Chrome cleanup returns the known Windows temporary-directory EPERM after the JSON is written. Expected: performance ≥ 95, TBT ≤ 50 ms, CLS ≤ 0.03.

- [x] **Step 6: Run final repository verification**

```powershell
npm run build
git diff --check
git status --short
```

Expected: build passes, no whitespace errors, and only intentional QA artifacts remain ignored.

- [x] **Step 7: Request code review and commit any test-first corrections**

Run standards and spec reviews against base `8c98279`. Fix every blocking finding with a failing regression test before implementation. Repeat `npm run build` after corrections.

If corrections were required:

```powershell
git add src tests
git commit -m "fix: finish research traversal verification"
```

Leave the browser on the research section and present the verified result to the user before offering branch integration options.
