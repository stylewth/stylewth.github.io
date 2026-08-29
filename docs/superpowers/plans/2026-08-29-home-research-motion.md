# Home Research Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flattened homepage research artwork with an approved layered composition and one restrained, accessible, scroll-triggered entrance animation.

**Architecture:** `ResearchInterests.astro` keeps ownership of semantic copy and visual layout. The homepage passes two explicit Astro image assets, while one small custom-element script adds a one-time entered state; the default HTML and CSS remain fully visible without JavaScript. The scene uses one raster apparatus/background, one transparent rabbit, and three CSS observation planes.

**Tech Stack:** Astro 7, TypeScript 6, component-scoped CSS, native `IntersectionObserver`, Vitest with happy-dom, Astro `Picture`, built-in `imagegen`, Lighthouse.

**Execution constraint:** The repository instructions prohibit creating a worktree without explicit user approval. Execute in the current checkout unless the user separately authorizes a worktree.

---

## File Map

| Path | Responsibility |
|---|---|
| `docs/superpowers/assets/home-research-motion-preview.png` | Approved visual master; never imported by production code |
| `src/assets/images/research-world-model-base.png` | Apparatus and environment with no rabbit and no observation planes |
| `src/assets/images/research-world-model-rabbit-layer.png` | One rabbit on a genuine transparent background |
| `src/assets/images/research-world-model-rabbit.png` | Delete after the layered assets are wired; the old flattened source must not remain as an unused alternative |
| `src/scripts/research-motion.ts` | Progressive enhancement and one-time intersection state |
| `src/scripts/research-motion.test.ts` | Observer, reduced-motion, failure, and reconnect behavior |
| `src/components/home/ResearchInterests.astro` | Layered scene markup, scoped presentation, responsive motion, and script import |
| `src/pages/index.astro` | Imports and passes the two production image assets |
| `tests/source-contracts.test.ts` | Source ownership, asset, dependency, and reduced-motion contracts |
| `tests/site-output.test.ts` | Built homepage structure, image, and route-local script contracts |

### Task 1: Produce the two approved production layers

**Files:**
- Reference: `docs/superpowers/assets/home-research-motion-preview.png`
- Create: `src/assets/images/research-world-model-base.png`
- Create: `src/assets/images/research-world-model-rabbit-layer.png`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write the failing asset contract**

Add this test inside the main `describe` block in `tests/source-contracts.test.ts`:

```ts
  it('stores the approved research scene as two explicit production layers', () => {
    const imageRoot = join(projectRoot, 'src', 'assets', 'images');
    const approvedPreview = join(
      projectRoot,
      'docs',
      'superpowers',
      'assets',
      'home-research-motion-preview.png',
    );
    const base = join(imageRoot, 'research-world-model-base.png');
    const rabbit = join(imageRoot, 'research-world-model-rabbit-layer.png');

    expect(existsSync(approvedPreview)).toBe(true);
    expect(existsSync(base)).toBe(true);
    expect(existsSync(rabbit)).toBe(true);
    expect(readFileSync(base).byteLength).toBeGreaterThan(10_000);
    expect(readFileSync(rabbit).byteLength).toBeGreaterThan(1_000);
  });
```

- [ ] **Step 2: Run the contract and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because both production layer files are absent.

- [ ] **Step 3: Generate the apparatus/background layer from the approved master**

Use `view_image` on `docs/superpowers/assets/home-research-motion-preview.png`, then use the built-in `imagegen` edit path with the approved preview as the sole reference and this exact prompt:

```text
Use case: precise-object-edit
Asset type: production background layer for a full-width academic website section
Primary request: Remove only the white rabbit and all three transparent observation planes from the approved reference. Reconstruct the newly exposed sky, dry mineral ground, circular opening, and apparatus interior naturally.
Invariants: keep the camera, crop, 3:2 dimensions, left-side negative space, landscape, lighting, warm bone palette, circular steel apparatus, base, bolts, perspective, horizon, and every remaining object unchanged.
Constraints: no rabbit, no animals, no glass planes, no colored marks, no text, no logo, no watermark; exactly one circular apparatus; preserve the empty circular opening so HTML and CSS layers can be placed inside it.
Avoid: redesigning the machine, changing the ring position, adding objects, changing weather, changing focal length, sci-fi glow, particles, HUD graphics.
```

Copy the selected result to:

```text
src/assets/images/research-world-model-base.png
```

Do not overwrite `docs/superpowers/assets/home-research-motion-preview.png`.

- [ ] **Step 4: Generate the transparent rabbit layer from the approved master**

Use `view_image` on the approved master again, then use the built-in `imagegen` transparent-background path with this exact prompt:

```text
Use case: background-extraction
Asset type: transparent foreground subject for an academic website animation
Primary request: Isolate the single matte-white rabbit from the approved reference as a complete clean cutout on a genuinely transparent background.
Invariants: preserve the rabbit's exact left-to-right mid-leap pose, proportions, ear positions, soft natural lighting, warm-white fur, restrained shadow modeling, and viewing angle.
Composition: center the entire rabbit with generous transparent padding on every side; no crop; landscape canvas tightly fitted around the full animal.
Constraints: exactly one rabbit; actual alpha transparency; no floor, sky, apparatus, glass, colored marks, text, logo, or watermark.
Avoid: extra limbs, duplicated ears, cartoon rendering, glossy 3D appearance, hard studio rim light, colored cast, halo or opaque background.
```

Copy the selected result to:

```text
src/assets/images/research-world-model-rabbit-layer.png
```

- [ ] **Step 5: Visually inspect both layer files**

Use `view_image` with original detail on both files. Confirm:

- the base contains no rabbit, plane, or reconstruction seam;
- the apparatus geometry and left negative space match the approved preview;
- the rabbit contains exactly one full animal with clean alpha edges;
- neither file contains text, logos, or extra subjects.

Reject and regenerate a layer if any condition fails. Do not repair generation defects with CSS masks or cloning.

- [ ] **Step 6: Run the asset contract and verify GREEN**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: all source-contract tests pass.

- [ ] **Step 7: Commit the approved production layers**

```powershell
git add -- src/assets/images/research-world-model-base.png src/assets/images/research-world-model-rabbit-layer.png tests/source-contracts.test.ts
git commit -m "assets: add layered research scene"
```

### Task 2: Add the one-time motion controller test-first

**Files:**
- Create: `src/scripts/research-motion.test.ts`
- Create: `src/scripts/research-motion.ts`

- [ ] **Step 1: Write the failing motion tests**

Create `src/scripts/research-motion.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let intersectionCallback: IntersectionObserverCallback | undefined;
let observe: ReturnType<typeof vi.fn>;
let disconnect: ReturnType<typeof vi.fn>;

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

async function mount(): Promise<HTMLElement> {
  await import('./research-motion');
  const host = document.createElement('research-motion');
  document.body.append(host);
  return host;
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  intersectionCallback = undefined;
  observe = vi.fn();
  disconnect = vi.fn();
  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn((callback: IntersectionObserverCallback) => {
      intersectionCallback = callback;
      return { observe, disconnect };
    }),
  );
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('research-motion', () => {
  it('prepares, observes, and enters once after the first intersection', async () => {
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(true);
    expect(host.hasAttribute('data-motion-entered')).toBe(false);
    expect(observe).toHaveBeenCalledWith(host);

    intersectionCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(host.hasAttribute('data-motion-entered')).toBe(false);

    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(host.hasAttribute('data-motion-entered')).toBe(true);
    expect(disconnect).toHaveBeenCalledTimes(1);

    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('keeps the final static state when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)));
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(false);
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });

  it('keeps the final static state when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(false);
  });

  it('disconnects cleanly before entry and can observe after reconnection', async () => {
    const host = await mount();
    host.remove();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(host.hasAttribute('data-motion-ready')).toBe(false);

    document.body.append(host);
    expect(observe).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npx vitest run src/scripts/research-motion.test.ts
```

Expected: FAIL because `src/scripts/research-motion.ts` does not exist.

- [ ] **Step 3: Implement the minimal custom element**

Create `src/scripts/research-motion.ts`:

```ts
const tagName = 'research-motion';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

class ResearchMotionElement extends HTMLElement {
  #observer?: IntersectionObserver;
  #frame = 0;

  connectedCallback(): void {
    if (this.#observer || this.hasAttribute('data-motion-entered')) return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia(reducedMotionQuery).matches) return;

    this.setAttribute('data-motion-ready', '');
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (this.hasAttribute('data-motion-entered')) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;

        this.#observer?.disconnect();
        this.#observer = undefined;
        this.#frame = window.requestAnimationFrame(() => {
          this.setAttribute('data-motion-entered', '');
          this.#frame = 0;
        });
      },
      { threshold: 0.24 },
    );
    this.#observer.observe(this);
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = undefined;
    if (this.#frame) window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    if (!this.hasAttribute('data-motion-entered')) {
      this.removeAttribute('data-motion-ready');
    }
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, ResearchMotionElement);
}

export {};
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npx vitest run src/scripts/research-motion.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run the complete source unit suite**

Run:

```powershell
npm test
```

Expected: all source unit tests pass with one additional test file and four additional tests.

- [ ] **Step 6: Commit the controller**

```powershell
git add -- src/scripts/research-motion.ts src/scripts/research-motion.test.ts
git commit -m "feat: add research motion controller"
```

### Task 3: Build the layered research scene and responsive motion

**Files:**
- Modify: `tests/source-contracts.test.ts`
- Modify: `src/components/home/ResearchInterests.astro`
- Modify: `src/pages/index.astro`
- Delete: `src/assets/images/research-world-model-rabbit.png`

- [ ] **Step 1: Write the failing component ownership contract**

Add this test to `tests/source-contracts.test.ts`:

```ts
  it('owns the layered research scene and restrained motion inside its component', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const research = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ResearchInterests.astro'),
      'utf8',
    );

    expect(indexPage).toContain("research-world-model-base.png");
    expect(indexPage).toContain("research-world-model-rabbit-layer.png");
    expect(indexPage).not.toContain("research-world-model-rabbit.png");
    expect(indexPage).toMatch(
      /<ResearchInterests[\s\S]*?baseImage=\{researchBaseImage\}[\s\S]*?subjectImage=\{researchSubjectImage\}[\s\S]*?\/>/,
    );
    expect(research).toContain('baseImage: ImageMetadata');
    expect(research).toContain('subjectImage: ImageMetadata');
    expect(research).toContain('<research-motion');
    expect(research).toContain('data-research-base');
    expect(research).toContain('data-research-subject');
    expect(research.match(/data-research-slice/g) ?? []).toHaveLength(3);
    expect(research).toContain("import '../../scripts/research-motion'");
    expect(research).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(research).not.toContain('gradient(');
    expect(research).not.toMatch(/\bfilter\s*:/);
  });
```

Update the existing explicit-props expectation from:

```ts
    expect(indexPage).toMatch(
      /<ResearchInterests\s+copy=\{en\.research\}\s+image=\{researchImage\}\s*\/>/,
    );
```

to:

```ts
    expect(indexPage).toMatch(
      /<ResearchInterests[\s\S]*?copy=\{en\.research\}[\s\S]*?baseImage=\{researchBaseImage\}[\s\S]*?subjectImage=\{researchSubjectImage\}[\s\S]*?\/>/,
    );
```

- [ ] **Step 2: Run the source contract and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the homepage still passes one flattened image and the component has no layered markup.

- [ ] **Step 3: Replace `ResearchInterests.astro` with the layered component**

Replace `src/components/home/ResearchInterests.astro` with:

```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  copy: {
    eyebrow: string;
    statement: string;
    description: string;
    interests: readonly string[];
    interestsLabel: string;
  };
  baseImage: ImageMetadata;
  subjectImage: ImageMetadata;
}

const { copy, baseImage, subjectImage } = Astro.props;
---

<research-motion class="research-motion" data-research-motion>
  <section
    id="research-interests"
    class="research-field"
    aria-labelledby="research-interests-title"
  >
    <div class="research-field__scene" aria-hidden="true">
      <div class="research-field__base" data-research-base data-motion-layer="base">
        <Picture
          src={baseImage}
          formats={['avif', 'webp']}
          fallbackFormat="jpeg"
          widths={[768, 1280, 1920]}
          sizes="100vw"
          alt=""
          loading="lazy"
        />
      </div>
      <div class="research-field__slices">
        <span class="research-field__slice" data-research-slice data-motion-layer="slice-1">
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
        </span>
        <span class="research-field__slice" data-research-slice data-motion-layer="slice-2">
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
        </span>
        <span class="research-field__slice" data-research-slice data-motion-layer="slice-3">
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
          <span class="research-field__mark"></span>
        </span>
      </div>
      <div class="research-field__subject" data-research-subject data-motion-layer="subject">
        <Picture
          src={subjectImage}
          formats={['avif', 'webp']}
          fallbackFormat="png"
          widths={[240, 360, 520]}
          sizes="(max-width: 48rem) 30vw, 13vw"
          alt=""
          loading="lazy"
        />
      </div>
    </div>
    <div class="research-field__content shell" data-motion-copy>
      <p class="eyebrow">{copy.eyebrow}</p>
      <h2 id="research-interests-title" class="research-field__statement">
        {copy.statement}
      </h2>
      <p class="research-field__description">{copy.description}</p>
      <ul class="interest-list" aria-label={copy.interestsLabel}>
        {copy.interests.map((interest) => <li>{interest}</li>)}
      </ul>
    </div>
  </section>
</research-motion>

<script>
  import '../../scripts/research-motion';
</script>

<style>
  .research-motion {
    display: block;
  }

  .research-field {
    position: relative;
    overflow: hidden;
    min-height: 42rem;
    background: var(--color-bone);
    isolation: isolate;
  }

  .research-field__scene,
  .research-field__base {
    position: absolute;
    inset: 0;
  }

  .research-field__scene {
    z-index: 0;
  }

  .research-field__base {
    opacity: 0.46;
  }

  .research-field__base :global(picture),
  .research-field__base :global(img) {
    width: 100%;
    height: 100%;
  }

  .research-field__base :global(img) {
    object-fit: cover;
    object-position: center;
  }

  .research-field__subject {
    position: absolute;
    z-index: 2;
    top: 43%;
    left: 65%;
    width: clamp(7rem, 12vw, 11rem);
  }

  .research-field__subject :global(picture),
  .research-field__subject :global(img) {
    width: 100%;
    height: auto;
  }

  .research-field__slice {
    position: absolute;
    top: 24%;
    width: 4.25%;
    height: 52%;
    border: 1px solid rgb(88 124 132 / 38%);
    background: rgb(255 255 255 / 10%);
    color: rgb(88 124 132 / 55%);
  }

  .research-field__slice:nth-child(1) {
    z-index: 1;
    left: 67%;
  }

  .research-field__slice:nth-child(2) {
    z-index: 3;
    left: 74%;
    border-color: rgb(177 116 73 / 32%);
    color: rgb(177 116 73 / 50%);
  }

  .research-field__slice:nth-child(3) {
    z-index: 3;
    left: 81%;
    border-color: rgb(177 116 73 / 32%);
    color: rgb(177 116 73 / 50%);
  }

  .research-field__mark {
    position: absolute;
    width: 0.24rem;
    height: 0.24rem;
    border: 1px solid currentColor;
    border-radius: 50%;
  }

  .research-field__mark:nth-child(1) { top: 16%; left: 28%; }
  .research-field__mark:nth-child(2) { top: 31%; left: 62%; }
  .research-field__mark:nth-child(3) { top: 49%; left: 35%; }
  .research-field__mark:nth-child(4) { top: 66%; left: 68%; }
  .research-field__mark:nth-child(5) { top: 82%; left: 42%; }

  .research-field__content {
    position: relative;
    z-index: 4;
    display: flex;
    min-height: 42rem;
    flex-direction: column;
    justify-content: center;
    padding-block: var(--space-section);
  }

  .research-field__statement {
    max-width: 11ch;
    margin-block-end: 2rem;
    font-size: clamp(2.6rem, 6.1vw, 5.5rem);
  }

  .research-field__description {
    max-width: 46ch;
    margin-block-end: 3rem;
  }

  .interest-list {
    display: grid;
    max-width: 50rem;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-text);
    grid-template-columns: repeat(3, 1fr);
    list-style: none;
  }

  .interest-list li {
    padding: 1rem 1rem 1rem 0;
    border-bottom: 1px solid var(--color-text);
    font-size: 0.88rem;
    font-weight: 600;
  }

  .research-motion[data-motion-ready] :is(
    .research-field__base,
    .research-field__subject,
    .research-field__slice,
    .research-field__content > *
  ) {
    transition-property: transform, opacity;
    transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__base {
    opacity: 0.2;
    transform: translateY(3%);
  }

  .research-motion[data-motion-ready] .research-field__base {
    transition-duration: 520ms;
  }

  .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__subject {
    opacity: 0;
    transform: translateY(18px);
  }

  .research-motion[data-motion-ready] .research-field__subject {
    transition-duration: 480ms;
    transition-delay: 50ms;
  }

  .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__slice {
    opacity: 0;
    transform: translateX(-12px);
  }

  .research-motion[data-motion-ready] .research-field__slice {
    transition-duration: 400ms;
  }

  .research-motion[data-motion-ready] .research-field__slice:nth-child(1) { transition-delay: 80ms; }
  .research-motion[data-motion-ready] .research-field__slice:nth-child(2) { transition-delay: 120ms; }
  .research-motion[data-motion-ready] .research-field__slice:nth-child(3) { transition-delay: 160ms; }

  .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__content > * {
    opacity: 0;
    transform: translateY(16px);
  }

  .research-motion[data-motion-ready] .research-field__content > * {
    transition-duration: 420ms;
  }

  .research-motion[data-motion-ready] .research-field__content > :nth-child(1) { transition-delay: 100ms; }
  .research-motion[data-motion-ready] .research-field__content > :nth-child(2) { transition-delay: 140ms; }
  .research-motion[data-motion-ready] .research-field__content > :nth-child(3) { transition-delay: 180ms; }
  .research-motion[data-motion-ready] .research-field__content > :nth-child(4) { transition-delay: 220ms; }

  @media (max-width: 48rem) {
    .research-field,
    .research-field__content {
      min-height: 38rem;
    }

    .research-field__base :global(img) {
      object-position: 68% center;
    }

    .research-field__subject {
      top: 44%;
      left: 52%;
      width: clamp(6rem, 28vw, 8.5rem);
    }

    .research-field__slice {
      top: 28%;
      width: 8%;
      height: 44%;
    }

    .research-field__slice:nth-child(1) { left: 59%; }
    .research-field__slice:nth-child(2) { left: 70%; }
    .research-field__slice:nth-child(3) { left: 81%; }

    .interest-list {
      grid-template-columns: 1fr;
    }

    .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__base {
      transform: none;
    }

    .research-motion[data-motion-ready]:not([data-motion-entered]) .research-field__subject {
      transform: translateY(12px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .research-motion :is(
      .research-field__base,
      .research-field__subject,
      .research-field__slice,
      .research-field__content > *
    ) {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
```

- [ ] **Step 4: Pass the two explicit image props from the homepage**

In `src/pages/index.astro`, replace:

```ts
import researchImage from '../assets/images/research-world-model-rabbit.png';
```

with:

```ts
import researchBaseImage from '../assets/images/research-world-model-base.png';
import researchSubjectImage from '../assets/images/research-world-model-rabbit-layer.png';
```

Replace:

```astro
  <ResearchInterests copy={en.research} image={researchImage} />
```

with:

```astro
  <ResearchInterests
    copy={en.research}
    baseImage={researchBaseImage}
    subjectImage={researchSubjectImage}
  />
```

- [ ] **Step 5: Remove the obsolete flattened production image**

After the homepage imports both layered assets, remove exactly:

```powershell
Remove-Item -LiteralPath 'src\assets\images\research-world-model-rabbit.png'
```

- [ ] **Step 6: Run the focused source contract**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: all source contracts pass.

- [ ] **Step 7: Run Astro diagnostics**

Run:

```powershell
npm run check
```

Expected: Astro reports zero errors, warnings, and hints.

- [ ] **Step 8: Commit the layered component**

```powershell
git add -- src/assets/images/research-world-model-rabbit.png src/components/home/ResearchInterests.astro src/pages/index.astro tests/source-contracts.test.ts
git commit -m "feat: layer homepage research scene"
```

### Task 4: Update production-output contracts for the enhanced homepage

**Files:**
- Modify: `tests/site-output.test.ts`

- [ ] **Step 1: Update the built-page expectations before rebuilding**

In `tests/site-output.test.ts`, rename:

```ts
  it('publishes complete metadata without executable scripts', () => {
```

to:

```ts
  it('publishes complete metadata with one route-local motion script', () => {
```

Replace the final assertion in that test:

```ts
    expect(html).not.toMatch(/<script(?![^>]*type="application\/ld\+json")[^>]*>/);
```

with:

```ts
    expect(executableScripts(html)).toHaveLength(1);
```

Replace the existing rabbit-picture output test with:

```ts
  it('emits the portrait before a lazy layered research scene', () => {
    const portraitPosition = html.indexOf('alt="Portrait of Tenghao Wang"');
    const basePosition = html.indexOf('data-research-base');
    const subjectPosition = html.indexOf('data-research-subject');
    const portraitPictureEnd = html.indexOf('</picture>', portraitPosition);
    const portraitPicture = html.slice(
      html.lastIndexOf('<picture', portraitPosition),
      portraitPictureEnd,
    );
    const basePictureEnd = html.indexOf('</picture>', basePosition);
    const basePicture = html.slice(basePosition, basePictureEnd);
    const subjectPictureEnd = html.indexOf('</picture>', subjectPosition);
    const subjectPicture = html.slice(subjectPosition, subjectPictureEnd);

    expect(portraitPosition).toBeGreaterThan(-1);
    expect(basePosition).toBeGreaterThan(portraitPosition);
    expect(subjectPosition).toBeGreaterThan(basePosition);
    expect(portraitPicture).toContain('type="image/avif"');
    expect(portraitPicture).toContain('type="image/webp"');
    expect(portraitPicture).toContain('loading="eager"');
    expect(portraitPicture).toContain('fetchpriority="high"');
    expect(basePicture).toContain('type="image/avif"');
    expect(basePicture).toContain('type="image/webp"');
    expect(basePicture).toContain('loading="lazy"');
    expect(subjectPicture).toContain('type="image/avif"');
    expect(subjectPicture).toContain('type="image/webp"');
    expect(subjectPicture).toContain('loading="lazy"');
    expect(html.match(/data-research-slice/g) ?? []).toHaveLength(3);
    const motionStart = html.indexOf('<research-motion');
    const motionOpeningTag = html.slice(motionStart, html.indexOf('>', motionStart));
    expect(motionOpeningTag).toContain('data-research-motion');
    expect(motionOpeningTag).not.toContain('data-motion-ready');
    expect(motionOpeningTag).not.toContain('data-motion-entered');
  });
```

Replace the route-local script policy test with:

```ts
  it('ships one route-local script only on Home and Elsewhere', () => {
    const scriptedRoutes = new Set(['index.html', 'elsewhere/index.html']);

    outputHtmlFiles().forEach((file) => {
      const page = readFileSync(file, 'utf8');
      const relativePath = relative(outputDirectory, file).replaceAll('\\', '/');
      expect(executableScripts(page), relativePath).toHaveLength(
        scriptedRoutes.has(relativePath) ? 1 : 0,
      );
    });
  });
```

- [ ] **Step 2: Run the site-output test against the old build and verify RED**

Run:

```powershell
npx vitest run tests/site-output.test.ts
```

Expected: FAIL because the existing `dist/index.html` still contains the old flattened image and zero homepage interaction scripts.

- [ ] **Step 3: Rebuild and verify GREEN**

Run:

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: all site-output tests pass; `dist/index.html` contains two layered pictures, exactly three observation slices, and one executable homepage script.

- [ ] **Step 4: Commit the output contracts**

```powershell
git add -- tests/site-output.test.ts
git commit -m "test: cover layered research output"
```

### Task 5: Complete automated, visual, accessibility, and performance verification

**Files:**
- Modify only when a discovered defect requires a fresh failing regression test and the smallest corresponding fix.

- [ ] **Step 1: Run the complete automated gate**

Run:

```powershell
npm run build
```

Expected:

- Astro diagnostics: zero errors, warnings, and hints;
- all source unit tests pass;
- all seven routes build;
- all site-output tests pass.

- [ ] **Step 2: Run the mechanical design checks**

Run:

```powershell
rg -n "gradient\(|\bfilter\s*:|mix-blend-mode|h-screen|scroll-snap|scroll-behavior:\s*smooth|framer-motion|gsap|tsparticles" src package.json
```

Expected: no matches.

Run:

```powershell
git status --short
```

Expected: no uncommitted files before browser QA.

- [ ] **Step 3: Start the production preview**

Run:

```powershell
npm run preview -- --host 127.0.0.1 --port 4321
```

Use a managed background process or reusable terminal session. Confirm `http://127.0.0.1:4321/` responds, and stop the exact preview process after verification.

- [ ] **Step 4: Verify desktop animation at 1440 by 1000**

Using the in-app browser:

1. load `/` at the top and confirm the profile remains unchanged;
2. scroll until roughly one quarter of the research section is visible;
3. confirm the base, rabbit, three slices, and copy settle within 700 milliseconds;
4. confirm movement is restrained, with no bounce, glow, blur, or loop;
5. scroll away and back and confirm the sequence does not replay;
6. confirm the apparatus, rabbit, slices, and title reproduce the approved static master;
7. confirm there are no console warnings or errors.

- [ ] **Step 5: Verify responsive and fallback behavior**

At 768, 390, and 320 pixel widths:

1. confirm there is no page-level horizontal overflow;
2. confirm the rabbit remains fully visible and does not collide with the title;
3. confirm the apparatus crop remains recognizable;
4. confirm mobile removes the base translation while retaining the short reveal;
5. emulate `prefers-reduced-motion: reduce` and confirm the final scene is immediately visible with no transition;
6. disable JavaScript or inspect the server-rendered page before enhancement and confirm every image layer and all copy are visible in their final state.

- [ ] **Step 6: Verify the script and research-image transfer budgets**

After `npm run build`, run:

```powershell
node --input-type=module -e "import { readFileSync } from 'node:fs'; import { join } from 'node:path'; import { gzipSync } from 'node:zlib'; const html=readFileSync('dist/index.html','utf8'); const scripts=[...html.matchAll(/<script(?![^>]*type=\"application\/ld\+json\")([^>]*)>([\s\S]*?)<\/script>/g)]; if(scripts.length!==1) throw new Error('Expected one homepage motion script'); const src=scripts[0][1].match(/\ssrc=\"([^\"]+)\"/)?.[1]; const code=src ? readFileSync(join('dist',src.replace(/^\//,''))) : scripts[0][2]; const bytes=gzipSync(code).byteLength; console.log('research-motion-gzip-bytes=' + bytes); if(bytes>2048) process.exit(1);"
```

Expected: one executable homepage script, inline or external, and `research-motion-gzip-bytes` no greater than 2048.

- [ ] **Step 7: Measure the production homepage with Lighthouse**

Create `tmp` if it does not exist, then run the normal homepage profile:

```powershell
New-Item -ItemType Directory -Path 'tmp' -Force | Out-Null
```

```powershell
npx --yes lighthouse http://127.0.0.1:4321/ --only-categories=performance --output=json --output-path=tmp/lighthouse-home-mobile.json --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```

Read the performance score, LCP, total blocking time, CLS, and total byte weight from the report. Required results:

- performance score at least 95;
- total blocking time at most 50 milliseconds;
- CLS at most 0.03;
- no new Lighthouse image-delivery issue caused by above-the-fold homepage media.

Then run a second profile anchored directly to the research section so its lazy images are requested:

```powershell
npx --yes lighthouse http://127.0.0.1:4321/#research-interests --only-categories=performance --output=json --output-path=tmp/lighthouse-research-mobile.json --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```

Verify that both research layers were requested and that their modern-browser transfer total is at most 300 KiB:

```powershell
$report = Get-Content -LiteralPath 'tmp\lighthouse-research-mobile.json' -Raw | ConvertFrom-Json
$researchRequests = @($report.audits.'network-requests'.details.items | Where-Object { $_.url -match 'research-world-model-(base|rabbit-layer)' })
if ($researchRequests.Count -lt 2) { throw 'Expected both research image layers to load' }
$researchBytes = ($researchRequests | Measure-Object transferSize -Sum).Sum
Write-Output ('research-image-transfer-bytes=' + $researchBytes)
if ($researchBytes -gt 307200) { throw 'Research image transfer exceeds 300 KiB' }
```

Expected: `research-image-transfer-bytes` no greater than 307200.

After recording the results, delete exactly the two diagnostic reports:

```powershell
Remove-Item -LiteralPath 'tmp\lighthouse-home-mobile.json','tmp\lighthouse-research-mobile.json'
```

If any threshold fails, add the smallest failing automated regression test, implement the targeted correction, rerun the focused test, then rerun this Lighthouse step.

- [ ] **Step 8: Run the final clean verification**

Run these commands separately:

```powershell
npm run build
```

```powershell
git status --short
```

```powershell
git log -6 --oneline
```

Expected: the full build passes and the worktree is clean.

- [ ] **Step 9: Record the final handoff**

Report:

- the two production asset paths;
- the focused and full test counts;
- desktop and mobile browser QA results;
- final Lighthouse metrics against the baseline;
- final commit list;
- any intentional visual difference from the approved master.
