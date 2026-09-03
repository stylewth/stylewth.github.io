# Representation and Point-Cloud Raster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce two registered transparent rabbit-state rasters, obtain visual approval, and replace the current procedural aligned and point-cloud renderers without changing traversal geometry.

**Architecture:** Edit the existing transparent rabbit twice so both outputs inherit its pose and canvas. Validate the generated PNG alpha and dimensions before presenting them in the visual-companion browser; only approved images enter `src/assets/images`. `ResearchRabbitState.astro` then renders the two approved responsive images while retaining the existing observation, surface, glass, clipping, and scroll systems.

**Tech Stack:** Built-in image generation editor, PNG/RGBA, Sharp metadata checks, Astro `Picture`, Vitest, visual-companion browser.

---

## File Map

| File | Responsibility |
|---|---|
| `src/assets/images/research-traversal-rabbit.png` | Primary edit target and registration reference; unchanged. |
| `src/assets/images/research-traversal-representation-v2.png` | Approved aligned-representation raster. |
| `src/assets/images/research-traversal-point-cloud-v2.png` | Approved reconstructed point-cloud raster. |
| `.superpowers/brainstorm/<session>/content/state-raster-review.html` | Ignored side-by-side approval screen. |
| `src/components/home/ResearchRabbitState.astro` | Render observation/surface states and the two approved raster states. |
| `tests/source-contracts.test.ts` | Enforce raster imports and removal of procedural aligned/point layers. |
| `tests/site-output.test.ts` | Preserve the existing state counts in production HTML. |

### Task 1: Generate the aligned-representation asset

**Files:**
- Read: `src/assets/images/research-traversal-rabbit.png`
- Create after approval: `src/assets/images/research-traversal-representation-v2.png`

- [ ] **Step 1: Inspect the edit target**

Open `research-traversal-rabbit.png` with the image viewer and confirm the complete 1536×1024 rabbit, pose, canvas, and transparent exterior are visible.

- [ ] **Step 2: Generate the representation edit**

Use the built-in image editor with the rabbit as the sole edit target and this prompt:

```text
Use case: stylized-concept
Asset type: registered transparent state texture for a website scroll transition
Primary request: transform only the interior appearance of the supplied white rabbit into a learned latent representation; preserve the exact canvas, pose, direction, scale, anatomy, and outer silhouette
Input image: primary edit target and strict spatial-registration reference
Subject: the same complete running side-profile rabbit, including ears, legs, tail, face, and eye region
Style/medium: elegant scientific 3D representation, translucent layered surfaces, localized feature nodes, and short aligned encoding paths
Color palette: cool cyan and blue-green with restrained warm amber accents and bone-white highlights
Composition/framing: identical to the input; no crop and no repositioning
Lighting/mood: soft dimensional studio light, refined and natural, not science-fiction
Constraints: change only the rabbit interior; integrate the eye into the representation style; genuine transparent alpha outside the rabbit; clean registered silhouette
Avoid: point-cloud appearance, uniform grid, wallpaper pattern, circuitry, HUD, text, watermark, glow, shadow, checkerboard, colored matte, or marks outside the rabbit
```

- [ ] **Step 3: Keep the output outside production assets until review**

Record the generated image path under the Codex generated-images directory. Do not overwrite or reference any production asset yet.

### Task 2: Generate the volumetric point-cloud asset

**Files:**
- Read: `src/assets/images/research-traversal-rabbit.png`
- Create after approval: `src/assets/images/research-traversal-point-cloud-v2.png`

- [ ] **Step 1: Generate the point-cloud edit**

Use the built-in image editor with the rabbit as the sole edit target and this prompt:

```text
Use case: stylized-concept
Asset type: registered transparent final-state texture for a website scroll transition
Primary request: reconstruct the supplied rabbit entirely as a beautiful volumetric 3D point cloud; preserve the exact canvas, pose, direction, scale, anatomy, and outer silhouette
Input image: primary edit target and strict spatial-registration reference
Subject: the same complete running side-profile rabbit, with every anatomical feature including the eye region formed from points rather than photographic fur
Style/medium: refined three-dimensional point clusters with readable far, middle, and near depth populations; organic Gaussian-splat-like volume without becoming blurry
Color palette: small muted slate far points, medium cyan middle points, larger bone-white and restrained amber near points
Composition/framing: identical to the input; no crop and no repositioning
Lighting/mood: soft directional depth lighting and subtle self-occlusion, elegant scientific visualization
Constraints: vary point size, density, overlap, brightness, and local occlusion to show rounded body volume; genuine transparent alpha outside the rabbit; clean registered silhouette
Avoid: photographic fur, photographic eye, flat dotted silhouette, voxels, mesh lines, neon glow, black background, ground shadow, checkerboard, colored matte, text, watermark, or particles outside the rabbit
```

- [ ] **Step 2: Keep the output outside production assets until review**

Record the generated image path under the Codex generated-images directory. Do not overwrite or reference any production asset yet.

### Task 3: Validate transparency and obtain visual approval

**Files:**
- Create: `.superpowers/brainstorm/<session>/content/state-raster-review.html`

- [ ] **Step 1: Validate both generated files**

Run this from the repository root with the two generated paths substituted verbatim:

```powershell
node -e "const sharp=require('sharp'); const paths=process.argv.slice(1); (async()=>{for(const p of paths){const m=await sharp(p).metadata(); if(m.channels!==4||!m.hasAlpha) throw new Error(p+' is not RGBA'); const a=await sharp(p).extractChannel(3).stats(); if(a.channels[0].min!==0||a.channels[0].max!==255) throw new Error(p+' has invalid alpha range'); console.log(p,m.width+'x'+m.height,'RGBA','alpha 0-255')}})()" <representation-path> <point-cloud-path>
```

Expected: both files report `RGBA` and `alpha 0-255`. If either fails, regenerate that asset; do not manufacture transparency with thresholding or background removal.

- [ ] **Step 2: Present a side-by-side browser review**

Create a fresh visual-companion HTML file showing each image at useful size against three backgrounds: neutral checkerboard, white, and charcoal. Label them `Representation: between panes 2 and 3` and `Point cloud: after pane 3`. Include the original rabbit as a smaller registration reference.

- [ ] **Step 3: Stop at the visual approval gate**

Ask the user to approve, reject, or request one targeted change for each image. Do not copy images into `src/assets/images` and do not edit production code before approval.

### Task 4: Add approved assets and lock the component contract

**Files:**
- Create: `src/assets/images/research-traversal-representation-v2.png`
- Create: `src/assets/images/research-traversal-point-cloud-v2.png`
- Modify: `tests/source-contracts.test.ts:685-705`

- [ ] **Step 1: Copy only the approved generated outputs**

Copy the two approved files to their exact versioned production paths without modifying pixel data.

- [ ] **Step 2: Write the failing source contract**

Replace the aligned/point-layer assertions in the existing rabbit-state test with:

```ts
expect(state).toContain("import representationImage from '../../assets/images/research-traversal-representation-v2.png';");
expect(state).toContain("import pointCloudImage from '../../assets/images/research-traversal-point-cloud-v2.png';");
expect(state).toContain('data-research-raster-state');
expect(state).not.toContain('data-research-aligned-layer');
expect(state).not.toContain('data-research-point-layer');
expect(state).not.toContain('pointDepths');
```

- [ ] **Step 3: Run the contract test and confirm failure**

Run `npx vitest run tests/source-contracts.test.ts`.

Expected: failure because the component still contains procedural aligned and point-cloud layers.

- [ ] **Step 4: Commit the approved assets and failing contract**

```powershell
git add -- src/assets/images/research-traversal-representation-v2.png src/assets/images/research-traversal-point-cloud-v2.png tests/source-contracts.test.ts
git commit -m "test: require generated traversal state rasters"
```

### Task 5: Replace procedural state renderers

**Files:**
- Modify: `src/components/home/ResearchRabbitState.astro`

- [ ] **Step 1: Import the approved rasters**

Add:

```astro
import representationImage from '../../assets/images/research-traversal-representation-v2.png';
import pointCloudImage from '../../assets/images/research-traversal-point-cloud-v2.png';
```

- [ ] **Step 2: Select the raster for generated states**

Add:

```ts
const rasterStateImage = state === 'aligned'
  ? representationImage
  : state === 'point-cloud'
    ? pointCloudImage
    : undefined;
```

- [ ] **Step 3: Render one responsive registered image**

Replace the existing `aligned` and `point-cloud` branches with:

```astro
{rasterStateImage && (
  <div class="research-rabbit-state__raster" data-research-raster-state={state}>
    <Picture
      src={rasterStateImage}
      formats={['avif', 'webp']}
      fallbackFormat="png"
      widths={[192, 320]}
      sizes="(max-width: 48rem) 4rem, 8rem"
      alt=""
      loading="lazy"
    />
  </div>
)}
```

- [ ] **Step 4: Replace obsolete styles**

Delete `pointDepths`, the aligned-layer CSS, and the three point-depth CSS rules. Add:

```css
.research-rabbit-state__raster,
.research-rabbit-state__raster :global(picture),
.research-rabbit-state__raster :global(img) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.research-rabbit-state__raster :global(img) {
  object-fit: contain;
}
```

- [ ] **Step 5: Run focused tests**

Run `npx vitest run tests/source-contracts.test.ts tests/site-output.test.ts`.

Expected: both files pass and the production HTML retains the existing state counts.

- [ ] **Step 6: Commit the renderer change**

```powershell
git add -- src/components/home/ResearchRabbitState.astro
git commit -m "feat: render generated traversal state rasters"
```

### Task 6: Verify the completed traversal

**Files:**
- Modify only if evidence is added: `docs/superpowers/specs/2026-09-03-representation-point-cloud-raster-design.md`

- [ ] **Step 1: Run the full repository verification**

Run `npm run build`.

Expected: Astro check, source tests, production build, and site-output tests all pass.

- [ ] **Step 2: Inspect the live traversal**

Open the homepage at desktop and mobile widths. Verify the aligned raster appears only between panes two and three, the volumetric point cloud appears after pane three, glass cross-sections retain correct clipping, reverse scrolling restores states, and no exterior marks or silhouette jumps appear.

- [ ] **Step 3: Record evidence and commit only if the specification is updated**

```powershell
git add -- docs/superpowers/specs/2026-09-03-representation-point-cloud-raster-design.md
git commit -m "docs: verify generated traversal states"
```
