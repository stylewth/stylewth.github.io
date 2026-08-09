# Favorite Card Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep favorite-card pointer targeting stable while adding refined hover, press, dialog-entry, and reduced-motion feedback.

**Architecture:** The absolutely positioned `.favorite-card` remains the fixed hit target and owns fan placement. Its child `.favorite-card__trigger` becomes the only animated visual layer; dialog motion stays local to `FavoritesStage.astro` and requires no script changes.

**Tech Stack:** Astro components, scoped CSS, Vitest source-contract tests

---

### Task 1: Lock down stable card targeting

**Files:**
- Modify: `tests/source-contracts.test.ts`
- Test: `tests/source-contracts.test.ts`

- [ ] **Step 1: Replace the old favorite-fan motion assertion with a failing stability contract**

Add a focused test that reads `FavoriteFan.astro` and asserts all of the following:

```ts
expect(fan).not.toMatch(/\.favorite-card:hover\s*\{[^}]*transform:/);
expect(fan).toMatch(
  /\.favorite-card:hover\s+\.favorite-card__trigger\s*\{[^}]*transform:[^}]*translate3d\([^)]*var\(--favorite-lift\)[^)]*\)[^}]*scale\(var\(--favorite-scale\)\)/,
);
expect(fan).toMatch(
  /\.favorite-card:active\s+\.favorite-card__trigger\s*\{[^}]*--favorite-lift:[^;}]+;[^}]*--favorite-scale:[^;}]+;/,
);
```

Update the existing reduced-motion contract so it expects the child trigger to return to `transform: none` instead of expecting hover to reproduce the fan transform.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- --run tests/source-contracts.test.ts
```

Expected: FAIL because the current `.favorite-card:hover` transforms the outer hit target and no child-layer press state exists.

### Task 2: Implement stable, tactile card motion

**Files:**
- Modify: `src/components/elsewhere/FavoriteFan.astro`
- Test: `tests/source-contracts.test.ts`

- [ ] **Step 1: Keep fan placement on the outer card and move interaction motion to the trigger**

Preserve the base `.favorite-card` transform but remove its transform transition. Add trigger-level custom properties and transitions:

```css
--favorite-lift: 0rem;
--favorite-scale: 1;
--favorite-visual-rotation: var(--fan-rotation);
transform:
  translate3d(0, var(--favorite-lift), 0)
  rotate(calc(var(--favorite-visual-rotation) - var(--fan-rotation)))
  scale(var(--favorite-scale));
transform-origin: 50% 85%;
transition:
  transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
  border-color 180ms ease,
  box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
will-change: transform;
```

On `.favorite-card:hover`, change only `z-index`. On `.favorite-card:hover .favorite-card__trigger`, set lift to `-0.7rem`, scale to `1.018`, visual rotation to `calc(var(--fan-rotation) * 0.18)`, strengthen the border, and add two restrained opaque shadows. On `.favorite-card:active .favorite-card__trigger`, reduce lift to `-0.32rem`, scale to `0.995`, and shorten the shadow.

- [ ] **Step 2: Respect reduced motion**

Inside `prefers-reduced-motion: reduce`, disable trigger transitions and set the hovered/active trigger transform to `none`; preserve border and focus indicators.

- [ ] **Step 3: Run the focused contract test and verify GREEN**

Run:

```powershell
npm test -- --run tests/source-contracts.test.ts
```

Expected: PASS.

### Task 3: Refine dialog selection feedback

**Files:**
- Modify: `src/components/elsewhere/FavoritesStage.astro`
- Modify: `tests/source-contracts.test.ts`

- [ ] **Step 1: Add a failing dialog-motion contract**

Assert that `.favorite-dialog[open]` defines an animation and that the reduced-motion block sets its animation to `none`:

```ts
expect(stage).toMatch(/\.favorite-dialog\[open\]\s*\{[^}]*animation:\s*favorite-dialog-enter/);
expect(stage).toMatch(
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.favorite-dialog\[open\]\s*\{[^}]*animation:\s*none;/,
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `npm test -- --run tests/source-contracts.test.ts` and expect the new dialog-motion assertion to fail.

- [ ] **Step 3: Add restrained dialog and backdrop entry keyframes**

Animate the open dialog for 240ms from `opacity: 0`, `translateY(0.55rem)`, and `scale(0.985)` to its resting state using the same emphasized ease. Animate the backdrop opacity for 180ms. Disable both animations under reduced motion.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `npm test -- --run tests/source-contracts.test.ts` and expect PASS.

### Task 4: Verify the whole site

**Files:**
- Verify only

- [ ] **Step 1: Run component behavior tests**

Run `npm test -- --run src/scripts/favorites-stage.test.ts` and expect all tests to pass.

- [ ] **Step 2: Run type and Astro validation**

Run `npm run check` and expect exit code 0 with no warnings.

- [ ] **Step 3: Run the production build and site tests**

Run `npm run build` and expect exit code 0 with all Vitest suites passing.

- [ ] **Step 4: Inspect the final diff**

Run `git diff --check` and `git diff -- src/components/elsewhere/FavoriteFan.astro src/components/elsewhere/FavoritesStage.astro tests/source-contracts.test.ts`. Confirm there is no outer-card hover transform, no JavaScript change, and no unrelated edit.
