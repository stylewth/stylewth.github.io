# Home Research Traversal Repair Design

Date: 2026-08-31  
Owner: Tenghao Wang  
Scope: repair the existing homepage rabbit traversal in `feature/home-research-motion`

This repair preserves the approved direction in `2026-08-30-home-research-scroll-traversal-design.md` and the archived visual drafts under `.superpowers/brainstorm/glass-traversal-1788098827/`. It does not introduce a new visual direction.

## Goal

Correct the two remaining deviations from the approved traversal:

1. each pane must advance the rabbit to a distinct registered representation rather than applying one global photo-to-points wipe;
2. each pane must visibly split the rabbit into behind-glass, refracted-inside-glass, and emerged-in-front portions.

## Current Failure

The current component renders one photographic rabbit and one point-pattern rabbit. Both are clipped by the global scroll percentage, so the rabbit changes continuously across the whole travel path and skips the approved intermediate states.

The current pane order is base subject, three refraction copies, then three complete pane overlays. A rabbit that has crossed a pane therefore remains visually underneath that pane. The refracted copies move only 2 pixels and do not establish an entrance face, glass interior, or exit face.

## Approved State Sequence

All four states use the same canvas, pose, scale, travel path, and alpha silhouette. Marks outside the rabbit silhouette are prohibited.

| Travel region | Dominant rabbit state | Meaning |
|---|---|---|
| Before pane one | Photographic observation | the physical rabbit or observed object |
| After pane one | Surface-structure representation | learned geometry and local structure |
| After pane two | Aligned representation | cyan and restrained amber multimodal features |
| After pane three | Volumetric point cloud | predictive 3D state with far, middle, and near depth layers |

Each pane is a transformation gate. While the rabbit intersects a pane, the part before the exit face keeps the previous state, the narrow glass interior shows a refracted blend, and the emerged part shows the next state. Crossing the pane completely commits the next state. Reverse scrolling uses the same spatial thresholds in reverse.

## Representation Rendering

Use one registered rabbit wrapper and four state renderers:

- the existing photographic `Picture` for observation;
- a masked cool contour-and-surface pattern for surface structure;
- a masked cyan/amber token pattern for aligned representation;
- three masked far/middle/near point layers for the final volumetric cloud.

The existing subject PNG remains the single alpha mask source. Intermediate states are component-owned vector patterns or gradients clipped by that mask; they are not generated raster fallbacks, canvas drawings, runtime particles, or independent animations.

State visibility is derived from pane geometry and the normalized scroll progress. It is not one global left/right wipe. The boundaries are spatially registered to the three pane entrance and exit faces so the transformation occurs only at the glass being crossed.

## Physical Glass and Occlusion

Each pane is rendered as three ordered parts:

1. **rear material:** the pane tint, reflection, and rear surface behind the portion of rabbit still inside or in front;
2. **refracted cross-section:** a narrow clipped copy of the rabbit state blend, displaced 7 pixels and compressed horizontally to 88% on desktop; mobile uses a 4-pixel displacement and 90% horizontal scale;
3. **front material and edge:** the front reflection and visible optical edge above the refracted portion.

The pane box occupies 7% of the scene width on desktop and 10% on mobile. The raster's existing optical edge provides the visible material thickness; CSS does not invent another edge. The rabbit is never globally stretched. The refracted slice returns to the registered silhouette immediately after the exit face.

Use the existing genuine transparent pane rasters twice per gate: one rear-material copy and one front-material copy with explicit opacity tokens. Visible glass borders must not be replaced by CSS rectangles. No chromatic halo, animated blur, glow, or free-floating particles are allowed.

The complete depth order for each gate is:

```text
base apparatus
-> rabbit portion still behind this pane
-> pane rear material
-> refracted rabbit cross-section
-> pane front material and optical edge
-> rabbit portion already emerged from this pane
-> later panes
-> semantic copy
```

The apparatus aperture continues to clip every rabbit state so the base ring remains the natural outer occluder.

## Progress Model

The existing normalized scroll progress remains the only runtime input. A pure state-calculation module maps that progress to:

- rabbit travel position;
- the active gate, if any;
- per-state clip ranges;
- per-pane behind, refracted, and emerged clip ranges.

Pane thresholds are explicit constants shared by rendering and tests. Invalid or non-monotonic thresholds throw during development rather than silently selecting a fallback state.

Reduced-motion and script-failure rendering use the approved static middle composition between panes two and three, showing the aligned representation without partial glass intersection.

## Component Boundaries

- `ResearchInterests.astro` owns state-layer markup, pane depth groups, masks, responsive geometry, and scoped styles.
- A small pure TypeScript module owns threshold validation and progress-to-state calculations.
- `research-traversal.ts` continues to own passive scroll and resize listeners, one scheduled animation frame, and one normalized progress write.
- `index.astro` continues to pass only the base, rabbit, and three pane images.

No shared site styles, navigation, copy, other routes, 3D engine, canvas renderer, animation library, or new production raster assets are required.

## Verification

Automated checks must prove:

- four registered rabbit states exist and only the final state has exactly three depth layers;
- pane one, two, and three each transition to the correct next state;
- every pane has rear material, one refracted cross-section, front material, and an emerged subject region;
- refracted geometry uses the approved narrow band, displacement, and compression rather than stretching the complete rabbit;
- forward and reverse progress produce symmetric state and occlusion calculations;
- reduced motion and script failure show the complete static aligned state;
- no canvas, WebGL, particle, animation, or new point-cloud raster dependency is introduced;
- existing source, output, build, and performance contracts still pass.

Browser checks at 1440, 768, 390, and 320 pixels must confirm that every pane crossing is legible as a local physical intersection, the four states are visually distinct without silhouette jitter, the final rabbit reads as volumetric point cloud, reverse scrolling restores prior states exactly, and text never collides with the apparatus.

## Exclusions

- changing the apparatus, landscape, typography, copy, or page structure;
- adding a fourth pane or a fifth representation state;
- replacing the registered silhouette with different rabbit poses;
- sticky scrolling, pointer-driven parallax, looping motion, chromatic aberration, glow, or science-fiction HUD treatment;
- generated repair assets or heuristic visual post-processing.
