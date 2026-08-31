# Home Research Traversal Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each of the three glass panes transform the scrolling rabbit into the next approved representation and render a legible behind-glass, refracted, and emerged-in-front intersection.

**Architecture:** Keep scroll progress responsible only for the rabbit's registered horizontal position. Put four rabbit renderers behind fixed scene-space clips: photographic observation, surface structure, aligned representation, and volumetric point cloud. Interleave each pane's rear raster, refracted previous/next state pair, front raster, and emerged next-state copy so normal DOM depth order produces physical occlusion in both scroll directions.

**Tech Stack:** Astro 7, TypeScript 6, scoped CSS, Astro `Picture`, CSS alpha masks and embedded SVG patterns, Vitest, existing transparent PNG assets.

---

## File Map

| Path | Responsibility |
|---|---|
| `src/components/home/ResearchRabbitState.astro` | Render exactly one registered rabbit state from the shared alpha mask. |
| `src/components/home/ResearchInterests.astro` | Compose the static state, dynamic subject, three physical pane gates, responsive clips, and depth order. |
| `tests/source-contracts.test.ts` | Enforce the four state renderers, three complete gate stacks, mask ownership, and prohibited effects. |
| `tests/site-output.test.ts` | Enforce built markup order, optimized pictures, static fallback, gate counts, and transfer budget. |
| `src/scripts/research-traversal.ts` | Remains unchanged; it writes the single scroll progress custom property. |

### Task 1: Add the four registered rabbit renderers

**Files:**
- Create: `src/components/home/ResearchRabbitState.astro`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Write the failing state-renderer contract**

Add this test inside the main `describe` block in `tests/source-contracts.test.ts`:

```ts
  it('defines four registered research rabbit states from one alpha mask', () => {
    const state = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ResearchRabbitState.astro'),
      'utf8',
    );

    expect(state).toContain("type RabbitState = 'observation' | 'surface' | 'aligned' | 'point-cloud';");
    expect(state).toContain('data-research-state={state}');
    expect(state).toContain('data-research-observation');
    expect(state).toContain('data-research-surface-layer');
    expect(state).toContain('data-research-aligned-layer');
    expect(state.match(/data-research-point-layer/g) ?? []).toHaveLength(1);
    expect(state).toContain('mask-image: var(--research-rabbit-mask)');
    expect(state).not.toContain('<canvas');
    expect(state).not.toMatch(/\b(?:filter|box-shadow|text-shadow)\s*:/);
  });
```

- [ ] **Step 2: Run the contract and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because `ResearchRabbitState.astro` does not exist.

- [ ] **Step 3: Create the state renderer**

Create `src/components/home/ResearchRabbitState.astro` with:

```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';

type RabbitState = 'observation' | 'surface' | 'aligned' | 'point-cloud';

interface Props {
  state: RabbitState;
  subjectImage: ImageMetadata;
  subjectMaskUrl: string;
  class?: string;
}

const { state, subjectImage, subjectMaskUrl, class: className } = Astro.props;
const pointDepths = ['far', 'middle', 'near'] as const;
---

<div
  class:list={['research-rabbit-state', `research-rabbit-state--${state}`, className]}
  data-research-state={state}
  style={`--research-rabbit-mask: url("${subjectMaskUrl}")`}
>
  {state === 'observation' && (
    <div class="research-rabbit-state__observation" data-research-observation>
      <Picture
        src={subjectImage}
        formats={['avif', 'webp']}
        fallbackFormat="png"
        widths={[192, 320]}
        sizes="(max-width: 48rem) 8.5rem, clamp(10rem, 17vw, 15rem)"
        alt=""
        loading="lazy"
      />
    </div>
  )}

  {state === 'surface' && (
    <>
      <span class="research-rabbit-state__masked research-rabbit-state__surface-lines" data-research-surface-layer></span>
      <span class="research-rabbit-state__masked research-rabbit-state__surface-points" data-research-surface-layer></span>
    </>
  )}

  {state === 'aligned' && (
    <>
      <span class="research-rabbit-state__masked research-rabbit-state__aligned-cyan" data-research-aligned-layer></span>
      <span class="research-rabbit-state__masked research-rabbit-state__aligned-amber" data-research-aligned-layer></span>
    </>
  )}

  {state === 'point-cloud' && pointDepths.map((depth) => (
    <span
      class={`research-rabbit-state__masked research-rabbit-state__point-depth research-rabbit-state__point-depth--${depth}`}
      data-research-point-layer
    ></span>
  ))}
</div>

<style>
  .research-rabbit-state,
  .research-rabbit-state__observation,
  .research-rabbit-state__masked { position: absolute; inset: 0; }
  .research-rabbit-state__observation :global(picture),
  .research-rabbit-state__observation :global(img) { width: 100%; height: 100%; }
  .research-rabbit-state__observation :global(img) { object-fit: contain; }
  .research-rabbit-state__masked {
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
  .research-rabbit-state__surface-lines {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='23' viewBox='0 0 29 23'%3E%3Cpath d='M-2 6C5 1 10 12 17 7S27 2 32 8M-3 17C4 12 10 23 18 17S27 13 32 18' fill='none' stroke='%235a929a' stroke-width='1'/%3E%3C/svg%3E");
    background-size: 29px 23px;
    opacity: .78;
  }
  .research-rabbit-state__surface-points {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='37' height='31' viewBox='0 0 37 31'%3E%3Ccircle cx='7' cy='8' r='1.2' fill='%232f5962'/%3E%3Ccircle cx='27' cy='22' r='.9' fill='%2387bcc2'/%3E%3C/svg%3E");
    background-size: 37px 31px;
    opacity: .66;
    transform: translate(1px, -1px);
  }
  .research-rabbit-state__aligned-cyan {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23'%3E%3Cpath d='M4 5h5v5H4zM14 14h5v5h-5z' fill='none' stroke='%2358b8c8' stroke-width='1.2'/%3E%3C/svg%3E");
    background-size: 23px 23px;
    opacity: .84;
  }
  .research-rabbit-state__aligned-amber {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='31' height='29' viewBox='0 0 31 29'%3E%3Ccircle cx='7' cy='9' r='1.5' fill='%23b96f43'/%3E%3Ccircle cx='24' cy='20' r='1' fill='%23d3a169'/%3E%3C/svg%3E");
    background-size: 31px 29px;
    opacity: .8;
    transform: translate(1px, .5px);
  }
  .research-rabbit-state__point-depth--far {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='17' viewBox='0 0 17 17'%3E%3Ccircle cx='3' cy='4' r='1.1' fill='%23243a4a'/%3E%3Ccircle cx='12' cy='11' r='.8' fill='%23243a4a'/%3E%3C/svg%3E");
    background-size: 17px 17px;
    opacity: .72;
    transform: translate(-1.5px, -1px);
  }
  .research-rabbit-state__point-depth--middle {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23'%3E%3Cellipse cx='5' cy='7' rx='1.35' ry='1' fill='%2358b8c8'/%3E%3Ccircle cx='17' cy='15' r='1.05' fill='%2358b8c8'/%3E%3C/svg%3E");
    background-size: 23px 23px;
    opacity: .86;
    transform: translate(.5px, 0);
  }
  .research-rabbit-state__point-depth--near {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='31' height='31' viewBox='0 0 31 31'%3E%3Cellipse cx='7' cy='8' rx='2.2' ry='1.45' fill='%23e6dfd1'/%3E%3Ccircle cx='22' cy='21' r='1.7' fill='%23d3a169'/%3E%3Ccircle cx='25' cy='6' r='.9' fill='%23e6dfd1'/%3E%3C/svg%3E");
    background-size: 31px 31px;
    opacity: .98;
    transform: translate(1.5px, .75px);
  }
</style>
```

- [ ] **Step 4: Run the focused contract and verify GREEN**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: all source-contract tests pass.

- [ ] **Step 5: Commit the renderer**

```powershell
git add -- src/components/home/ResearchRabbitState.astro tests/source-contracts.test.ts
git commit -m "feat: add registered research rabbit states"
```

### Task 2: Replace the global wipe with three physical transformation gates

**Files:**
- Modify: `src/components/home/ResearchInterests.astro`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Replace the old scene assertions with the failing gate contract**

In the existing `owns the layered research scene and restrained motion inside its component` test, keep the asset and responsive-size assertions, then replace the old photo/point wipe assertions with:

```ts
    expect(research).toContain("import ResearchRabbitState from './ResearchRabbitState.astro';");
    expect(research).toContain("previous: 'observation', next: 'surface'");
    expect(research).toContain("previous: 'surface', next: 'aligned'");
    expect(research).toContain("previous: 'aligned', next: 'point-cloud'");
    expect(research.match(/data-research-gate/g) ?? []).toHaveLength(1);
    expect(research.match(/data-research-pane-rear/g) ?? []).toHaveLength(1);
    expect(research.match(/data-research-refraction/g) ?? []).toHaveLength(1);
    expect(research.match(/data-research-pane-front/g) ?? []).toHaveLength(1);
    expect(research.match(/data-research-emerged/g) ?? []).toHaveLength(1);
    expect(research).toContain('data-research-static-subject');
    expect(research).toContain('data-research-dynamic');
    expect(research).toContain('scaleX(.88)');
    expect(research).toContain('calc(-50% + 7px)');
    expect(research).toContain('scaleX(.9)');
    expect(research).toContain('calc(-50% + 4px)');
    expect(research).not.toContain('calc(100% - var(--research-progress))');
```

- [ ] **Step 2: Run the contract and verify RED**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
```

Expected: FAIL because the current component has no state component, gate stack, static aligned fallback, or emerged regions.

- [ ] **Step 3: Add the registered gate data and component import**

In `ResearchInterests.astro`, replace `pointDepths` with the state component import and gate configuration:

```astro
import ResearchRabbitState from './ResearchRabbitState.astro';

const paneNames = ['one', 'two', 'three'] as const;
const gates = [
  { name: 'one', previous: 'observation', next: 'surface' },
  { name: 'two', previous: 'surface', next: 'aligned' },
  { name: 'three', previous: 'aligned', next: 'point-cloud' },
] as const;
```

- [ ] **Step 4: Replace the current scene subject, refraction, and pane markup**

Keep the base `Picture`, then replace the current subject/refraction/pane blocks with:

```astro
      <div class="research-field__aperture-layer research-field__static-subject" data-research-static-subject>
        <div class="research-field__travel-track research-field__travel-track--static">
          <div class="research-field__rabbit">
            <ResearchRabbitState state="aligned" subjectImage={subjectImage} subjectMaskUrl={subjectMask.src} />
          </div>
        </div>
      </div>

      <div class="research-field__aperture-layer research-field__subject-layer" data-research-dynamic data-research-subject>
        <div class="research-field__travel-track">
          <div class="research-field__rabbit" data-research-rabbit>
            <ResearchRabbitState state="observation" subjectImage={subjectImage} subjectMaskUrl={subjectMask.src} />
          </div>
        </div>
      </div>

      {gates.map(({ name, previous, next }, index) => (
        <div class={`research-field__gate research-field__gate--${name}`} data-research-gate style={`--gate-index: ${index}`}>
          <div class={`research-field__pane research-field__pane--${name} research-field__pane--rear`} data-research-dynamic data-research-pane-rear>
            <Picture src={paneImages[index]} formats={['avif', 'webp']} fallbackFormat="png" widths={[96, 160]} sizes="10vw" alt="" loading="lazy" />
          </div>

          <div class="research-field__aperture-layer research-field__refraction" data-research-dynamic data-research-refraction>
            <div class={`research-field__scene-region research-field__scene-region--pane-${name}`}>
              <div class="research-field__travel-track research-field__travel-track--refracted">
                <div class="research-field__rabbit">
                  <ResearchRabbitState class="research-field__refraction-state research-field__refraction-state--previous" state={previous} subjectImage={subjectImage} subjectMaskUrl={subjectMask.src} />
                  <ResearchRabbitState class="research-field__refraction-state research-field__refraction-state--next" state={next} subjectImage={subjectImage} subjectMaskUrl={subjectMask.src} />
                </div>
              </div>
            </div>
          </div>

          <div class={`research-field__pane research-field__pane--${name} research-field__pane--front`} data-research-dynamic data-research-pane-front>
            <Picture src={paneImages[index]} formats={['avif', 'webp']} fallbackFormat="png" widths={[96, 160]} sizes="10vw" alt="" loading="lazy" />
          </div>

          <div class="research-field__aperture-layer research-field__emerged" data-research-dynamic data-research-emerged>
            <div class={`research-field__scene-region research-field__scene-region--after-${name}`}>
              <div class="research-field__travel-track">
                <div class="research-field__rabbit">
                  <ResearchRabbitState state={next} subjectImage={subjectImage} subjectMaskUrl={subjectMask.src} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
```

- [ ] **Step 5: Replace the old photo/point wipe and pane CSS with registered clips**

Keep the base, content, typography, interest-list, and overall responsive rules. Replace the subject/refraction/pane rules with:

```css
  .research-field__aperture-layer { position: absolute; inset: 0; clip-path: ellipse(18% 46% at 72% 49%); overflow: hidden; }
  .research-field__static-subject { z-index: 2; }
  .research-field__subject-layer { z-index: 2; }
  .research-field__travel-track { position: absolute; top: 46%; left: 60%; width: 27%; height: 20%; }
  .research-field__travel-track--static { --research-progress: 70%; }
  .research-field__rabbit { position: absolute; top: 50%; left: var(--research-progress); width: clamp(10rem, 17vw, 15rem); aspect-ratio: 3 / 2; transform: translate(-50%, -50%); }
  .research-field__gate { display: contents; }
  .research-field__scene-region { position: absolute; inset: 0; overflow: hidden; }
  .research-field__pane { position: absolute; top: 24%; width: 7%; height: 52%; }
  .research-field__pane--one { left: 66%; }
  .research-field__pane--two { left: 73%; }
  .research-field__pane--three { left: 80%; }
  .research-field__pane--rear { z-index: calc(3 + var(--gate-index) * 4); opacity: .24; }
  .research-field__refraction { z-index: calc(4 + var(--gate-index) * 4); pointer-events: none; }
  .research-field__pane--front { z-index: calc(5 + var(--gate-index) * 4); opacity: .48; }
  .research-field__emerged { z-index: calc(6 + var(--gate-index) * 4); pointer-events: none; }
  .research-field__pane :global(picture), .research-field__pane :global(img) { width: 100%; height: 100%; }
  .research-field__pane :global(img) { object-fit: fill; }
  .research-field__scene-region--pane-one { clip-path: inset(24% 27% 24% 66%); }
  .research-field__scene-region--pane-two { clip-path: inset(24% 20% 24% 73%); }
  .research-field__scene-region--pane-three { clip-path: inset(24% 13% 24% 80%); }
  .research-field__scene-region--after-one { clip-path: inset(0 0 0 73%); }
  .research-field__scene-region--after-two { clip-path: inset(0 0 0 80%); }
  .research-field__scene-region--after-three { clip-path: inset(0 0 0 87%); }
  .research-field__travel-track--refracted .research-field__rabbit { opacity: .88; transform: translate(calc(-50% + 7px), -50%) scaleX(.88); }
  :global(.research-field__refraction-state--previous) { clip-path: inset(0 45% 0 0); opacity: .78; }
  :global(.research-field__refraction-state--next) { clip-path: inset(0 0 0 45%); opacity: .84; }
  .research-traversal[data-traversal-ready] .research-field__static-subject { visibility: hidden; }
  .research-traversal:not([data-traversal-ready]) [data-research-dynamic] { visibility: hidden; }
```

Inside the existing mobile media query, replace the old aperture, refraction, and pane coordinates with:

```css
    .research-field__aperture-layer { clip-path: ellipse(26.5% 32% at 73% 49%); }
    .research-field__travel-track { top: 46%; left: 48%; width: 42%; height: 20%; }
    .research-field__rabbit { width: 8.5rem; }
    .research-field__pane { top: 22%; width: 10%; height: 56%; }
    .research-field__pane--one { left: 54%; }
    .research-field__pane--two { left: 66%; }
    .research-field__pane--three { left: 78%; }
    .research-field__scene-region--pane-one { clip-path: inset(22% 36% 22% 54%); }
    .research-field__scene-region--pane-two { clip-path: inset(22% 24% 22% 66%); }
    .research-field__scene-region--pane-three { clip-path: inset(22% 12% 22% 78%); }
    .research-field__scene-region--after-one { clip-path: inset(0 0 0 64%); }
    .research-field__scene-region--after-two { clip-path: inset(0 0 0 76%); }
    .research-field__scene-region--after-three { clip-path: inset(0 0 0 88%); }
    .research-field__travel-track--refracted .research-field__rabbit { transform: translate(calc(-50% + 4px), -50%) scaleX(.9); }
```

- [ ] **Step 6: Run source checks and verify GREEN**

Run:

```powershell
npx vitest run tests/source-contracts.test.ts
npm run check
```

Expected: both commands pass with no warnings.

- [ ] **Step 7: Commit the gate architecture**

```powershell
git add -- src/components/home/ResearchInterests.astro tests/source-contracts.test.ts
git commit -m "fix: restore per-pane rabbit transformations"
```

### Task 3: Lock the built output and visual fallback

**Files:**
- Modify: `tests/site-output.test.ts`

- [ ] **Step 1: Replace the old built-scene counts with the complete gate contract**

In `emits the ordered research traversal scene with optimized lazy pictures`, replace the old position and count assertions with:

```ts
    const basePosition = html.indexOf('data-research-base');
    const staticPosition = html.indexOf('data-research-static-subject');
    const subjectPosition = html.indexOf('data-research-subject');
    const gatePosition = html.indexOf('data-research-gate');

    const layerPositions = [basePosition, staticPosition, subjectPosition, gatePosition];
    layerPositions.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect(layerPositions).toEqual([...new Set(layerPositions)].sort((a, b) => a - b));
    expect(html.match(/data-research-gate/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-pane-rear/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-refraction/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-pane-front/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-emerged/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-state="observation"/g) ?? []).toHaveLength(2);
    expect(html.match(/data-research-state="surface"/g) ?? []).toHaveLength(3);
    expect(html.match(/data-research-state="aligned"/g) ?? []).toHaveLength(4);
    expect(html.match(/data-research-state="point-cloud"/g) ?? []).toHaveLength(2);
    expect(html.match(/data-research-point-layer/g) ?? []).toHaveLength(6);
```

Update the optimized-picture assertion to expect nine `picture` elements in the research section:

```ts
    expect(scenePictures).toHaveLength(9);
```

Keep all existing modern format, mask URL, no-canvas, no-foreground, and transfer-budget assertions.

- [ ] **Step 2: Build and run the output test**

Run:

```powershell
npm run build:site
npx vitest run tests/site-output.test.ts
```

Expected: both commands pass; the research section contains three complete gates and the normal modern-browser scene stays at or below 307,200 bytes.

- [ ] **Step 3: Run the complete repository verification**

Run:

```powershell
npm run build
```

Expected: Astro check, component tests, production build, and all site tests pass.

- [ ] **Step 4: Commit output verification**

```powershell
git add -- tests/site-output.test.ts
git commit -m "test: enforce physical research traversal gates"
```

### Task 4: Browser QA and final evidence

**Files:**
- Create: `docs/superpowers/assets/research-repair-desktop-1440.png`
- Create: `docs/superpowers/assets/research-repair-mobile-390.png`
- Modify: `docs/superpowers/specs/2026-08-31-home-research-traversal-repair-design.md`

- [ ] **Step 1: Start the built preview**

Run:

```powershell
npm run preview -- --host 127.0.0.1
```

Expected: Astro prints a local preview URL without build or runtime errors.

- [ ] **Step 2: Inspect forward, paused, and reverse traversal at desktop width**

At 1440 pixels wide, scroll through the research section and confirm all of the following:

```text
before pane one: photographic observation
after pane one: cool surface structure
after pane two: cyan/amber aligned representation
after pane three: far/middle/near volumetric point cloud
inside every pane: local 7px displacement and 88% horizontal compression only
after every pane: emerged rabbit portion is above that pane and below later panes
reverse scroll: identical boundaries in reverse with no retained state
```

Save the evidence screenshot to `docs/superpowers/assets/research-repair-desktop-1440.png`.

- [ ] **Step 3: Inspect responsive and static modes**

At 390 pixels wide, verify the three panes remain visible, the rabbit stays inside the aperture, the refraction uses 4-pixel displacement and 90% horizontal scale, and text does not collide with the scene. Then emulate reduced motion and disable JavaScript separately; both must show one complete aligned rabbit with dynamic gate layers hidden.

Save the evidence screenshot to `docs/superpowers/assets/research-repair-mobile-390.png`.

- [ ] **Step 4: Record verification results**

Append this section to the repair design document with the actual command results and inspected widths:

```markdown
## Verification Record

- `npm run build`: passed.
- Browser widths: 1440 and 390 pixels inspected.
- Forward, pause, and reverse: passed.
- Four registered states: passed.
- Three local glass intersections: passed.
- Reduced motion and JavaScript-disabled aligned fallback: passed.
- Evidence: `docs/superpowers/assets/research-repair-desktop-1440.png` and `docs/superpowers/assets/research-repair-mobile-390.png`.
```

- [ ] **Step 5: Commit the verified repair**

```powershell
git add -- docs/superpowers/specs/2026-08-31-home-research-traversal-repair-design.md docs/superpowers/assets/research-repair-desktop-1440.png docs/superpowers/assets/research-repair-mobile-390.png
git commit -m "docs: verify research traversal repair"
```
