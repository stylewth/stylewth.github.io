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

The existing normalized scroll progress remains the only runtime input and controls only the registered rabbit travel position. State and occlusion changes are fixed spatial clips registered to the three pane boxes:

- the base subject remains below every pane;
- the pane-one emerged copy is clipped to the region after pane one and renders surface structure;
- the pane-two emerged copy is clipped to the region after pane two and renders aligned representation;
- the pane-three emerged copy is clipped to the region after pane three and renders the volumetric cloud;
- each refraction copy is clipped to its pane interior and blends that pane's previous and next states.

This makes the pane geometry itself the transition threshold. Forward and reverse scrolling traverse the same registered clips without a second time-based state model that could drift from responsive layout.

Reduced-motion and script-failure rendering use the approved static middle composition between panes two and three, showing the aligned representation without partial glass intersection.

## Component Boundaries

- `ResearchInterests.astro` owns state-layer markup, pane depth groups, masks, responsive geometry, and scoped styles.
- `research-traversal.ts` continues to own passive scroll and resize listeners, one scheduled animation frame, and one normalized progress write.
- `index.astro` continues to pass only the base, rabbit, and three pane images.

No shared site styles, navigation, copy, other routes, 3D engine, canvas renderer, animation library, or new production raster assets are required.

## Verification

Automated checks must prove:

- four registered rabbit states exist and only the final state has exactly three depth layers;
- pane one, two, and three each transition to the correct next state;
- every pane has rear material, one refracted cross-section, front material, and an emerged subject region;
- refracted geometry uses the approved narrow band, displacement, and compression rather than stretching the complete rabbit;
- forward and reverse progress traverse the same fixed state and occlusion clips;
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

## Verification Record

- `npm run build`: passed.
- Browser widths inspected: `1440x1000` and `390x900`.
- Desktop forward and pause: at `25.176%` the rabbit still reads as the physical subject entering the first transition; at `50.09%` the rabbit reads as the aligned mid-traversal representation with local glass occlusion and refraction; at `72.056%` the whole rabbit has cleared the third exit and reads as a volumetric point cloud with distinct far, middle, and near depth.
- Desktop reverse: scrolling back from `72.056%` to `49.942%` restores the earlier state boundary correctly with matching glass thresholds in reverse.
- Mobile forward and pause: at `55.205%` and `79.901%` the traversal remains legible, the rabbit stays inside the aperture, and the three panes preserve the expected local transition behavior.
- Glass behavior: all three panes show rear/front material occlusion and readable refracted offset slices; console `warn` and `error` logs were empty during browser QA.
- Reduced-motion and script-failure evidence: verified through the automated `matchMedia(true)` branch in `research-traversal.test.ts` plus static CSS and built-output fallback contracts. This record does not claim a live browser-side reduced-motion or JavaScript-off toggle.
- Evidence: `docs/superpowers/assets/research-repair-desktop-1440.png` and `docs/superpowers/assets/research-repair-mobile-390.png`.

## Revision 2026-09-03: Registered raster states and measured geometry

This revision supersedes the intermediate-state rendering and pane/aperture geometry above. The narrative, gating, occlusion architecture, progress model, and component boundaries are unchanged.

### Owner-drawn registered state rasters

The surface, aligned, and point-cloud states are now owner-drawn transparent rasters (`research-traversal-representation.png`, `research-traversal-point-cloud.png`) registered to the rabbit's 3:2 frame, replacing the embedded SVG pattern layers. This corrects the failed "pattern over photo" composite where the photographic rabbit remained visible under every state: the photographic subject layer is now spatially clipped at the pane-one exit face (`research-field__scene-region--unlearned`), so each travel region renders exactly one dominant state. The aligned state adds the masked cyan/amber accent pattern over the representation body; the point-cloud state keeps three parallax depth copies (opacity 0.3/0.55/1, ±3px shifts) of the single bead-cloud raster. Because the new rasters' inked silhouettes run ~8-9% wider than the photographic rabbit, each renderer compensates with a fixed fit transform (`scale(0.918)` / `scale(0.923)` with sub-percent offsets) back to the measured body box; the rabbit PNG remains the sole alpha-mask source and its stray alpha speckles outside the body component were zeroed (147 pixels, same file). The new rasters are produced by the site owner, not generated fallbacks.

### Measured pane and aperture geometry

Pixel measurement of the rasters replaced the nominal values:

- The pane rasters' glass strips occupy only 15.4%/17.5%/19.7% of their canvas width; each pane picture is therefore scaled 649%/571%/508% (with a 104.6% height fill) inside a shared box so the visible glass exactly fills it. All three panes use the same registered box — 3.6% wide and full-opening tall (69% of the scene on desktop, 61% on mobile) — so the sheets read as mounted in the ring: the aperture ellipse clips their ends into arcs behind the ring band.
- The panes are distributed evenly inside the measured ring opening: desktop panes at 60.7/67.8/74.9 (exits 64.3/71.4/78.5) with equal 3.5% gaps and margin; mobile panes at 54.5/63.6/72.7 (exits 60.7/69.8/78.9) with equal 2.9-3.1% gaps. The right side of the opening stays as the post-exit runway.
- The subject is 8.75rem on desktop and 4.5rem on mobile. Its travel track starts at 54% (desktop) / 44.9% (mobile), so the rabbit emerges from behind the left ring band and, past the last pane, is progressively occluded by the right ring band. The aperture ellipse stays recalibrated to the base raster's actual opening: `15.8% 34.6% at 73% 46.4%` desktop, `23.4% 30.5% at 74.5% 47%` mobile.
- Each rear and front pane copy sits inside an aperture-clipped frame (`research-field__pane-frame`) and is separated by ±3 px with opacity tokens 0.42 rear / 0.5 front for material thickness. The interest list is capped at 34rem. Static fallback progress is 74% desktop / 87% mobile (aligned body just past the last pane).

### Mid-pane crossing switch

The crossing layer switch is registered to each pane's vertical midline, not its entry face. Each pane's refraction slice is split into two spatially clipped copies of the same displaced track: the entry half renders between the pane's rear and front material (rabbit seen through the glass), and the exit half renders above the front material (rabbit riding over the glass). The per-gate depth order is therefore rear material -> entry-half slice -> front material -> exit-half slice -> emerged body, with later panes still occluding earlier bodies. Handing over exactly at the midline makes the subject visibly pierce the middle of each sheet.

### Verification Record 2026-09-03

- `npm run build`: passed (0 errors; 135 tests green including the 300 KiB scene budget with both new rasters).
- Browser widths inspected: `1440x1000`, `768x1000`, `390x900`.
- Desktop: at 5% the rabbit is the pure photographic subject before the first glass; at 30% it is the ink representation with no photographic carry-over; at 65% the third crossing shows representation behind the glass and bead point-cloud emerging; at 80% the whole subject reads as the bead volumetric cloud. Reverse from 80% to 30% restores the identical representation frame.
- Glass: all three panes render inside the ring opening with visible material and inter-pane gaps at every inspected width; no horizontal overflow at 390; interest labels no longer intersect the apparatus at 1440.
