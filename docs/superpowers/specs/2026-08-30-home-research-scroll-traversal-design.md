# Home Research Scroll Traversal Design

Date: 2026-08-30  
Owner: Tenghao Wang  
Scope: homepage research-interest section only

This design supersedes the visual-layer and motion decisions in `2026-08-29-home-research-motion-design.md`. The earlier performance, accessibility, page-scope, and no-global-redesign constraints remain in force.

## Goal

Restore the coherent editorial-photographic composition of the approved master while making one restrained interaction legible: as the visitor scrolls, a rabbit moves from left to right through three physical observation panes. Scroll position directly controls the traversal, including pause and reverse.

The section must not read as a stock rabbit pasted over a background or as CSS rectangles placed over a photograph.

## Diagnosis of the Rejected Implementation

The rejected implementation did run, but its one-time animation began as soon as the hash-linked section loaded. Browser sampling showed:

| Sample | Rabbit opacity | Rabbit translation | First pane opacity |
|---|---:|---:|---:|
| Load | 0 | 18 px | 0 |
| 100 ms after load | 0.586 of 0.72 final | 3.34 px remaining | 0.794 |
| 800 ms after load | 0.72 | 0 | 1 |

Most visible change was already complete within the first 100 milliseconds, before the newly opened browser view was easy to perceive. The 18-pixel subject movement was also too small to communicate traversal. A DOM entered-state check therefore passed while the user reasonably experienced no animation.

The composition failed independently of timing:

- the separately sourced rabbit had different lighting, scale, pose, color, and edge treatment from the scene;
- the observation panes were visible CSS outlines without material thickness, reflection, or refraction;
- validating assets separately for transparency, licensing, and byte size did not validate the final composite.

## Approved Decisions

- Visual baseline: the approved photographic master in `docs/superpowers/assets/home-research-motion-preview.png`.
- Motion control: continuous scroll progress, not a one-time entrance animation.
- Direction: left to right.
- Layer strategy: rebuild matched photographic layers; do not repair the current stock-subject and CSS-pane composition.
- Occlusion architecture: the user explicitly approved using the circular ring already present in the base image as the natural occluder. The moving subject is clipped to the apparatus aperture; an independent foreground raster is prohibited.
- Representation narrative: the rabbit begins photographic, is progressively abstracted while crossing the three panes, and exits as a visibly different predictive representation.
- Rendering choice: the final state only needs to communicate a volumetric point cloud. It is a lightweight, scroll-driven masked illustration, not a real 3D point-cloud renderer.
- Page behavior: normal document scrolling without sticky pinning or scroll hijacking.

## Static Composition Gate

Before motion code changes, produce a new static composite and review it in the browser at desktop and mobile widths.

The composite must preserve the approved master's:

- left-side negative space and readable title area;
- right-side circular scientific apparatus and credible geometry;
- warm white, bone, light-gray, and restrained dark-metal palette;
- soft natural light, ground contact, grain, and perspective;
- one horizontal white rabbit in a forward-moving side profile;
- three transparent physical observation panes inside the apparatus.

The rabbit, pane material, environment, and apparatus must be generated or reconstructed as parts of the same scene. An unrelated stock animal is not an acceptable substitute. If a required transparent layer cannot be produced with genuine alpha, continue targeted retries based on the recorded pixel-alpha and crop/canvas failures; never introduce a mask, threshold cutout, stock replacement, CSS material, or other fabricated fallback.

## Photographic Layer Model

The final scene uses four explicit depth groups:

1. **Base environment and apparatus:** sky, ground, distant geometry, and the complete circular device, including the ring and fasteners that remain in the base image.
2. **Aperture-clipped rabbit subject:** one horizontal white rabbit with scene-matched light, color temperature, perspective, grain, and edge softness. Its entire motion layer is clipped to an ellipse matching the inner apparatus opening so the base ring naturally occludes it.
3. **Pane refraction regions:** clipped copies of the subject visible only within the three pane interiors, offset by no more than 2 pixels to create restrained optical displacement.
4. **Physical pane overlays:** genuine transparent raster layers containing reflection, faint tint, edge thickness, and surface variation. CSS may position these layers but must not draw their visible borders or material.

The clipped refraction regions are invisible masks, not visible rectangular UI. They may adjust only transform and opacity; no animated blur, glow, hue shift, or filter effect is allowed.
No independent foreground image is generated or accepted. The four depth groups remain ordered as base, aperture-clipped subject, refractions, and pane overlays.

## Representation Transformation

The rabbit keeps one registered silhouette and travel path, while its interior representation changes:

1. **Observation:** the photographic rabbit is dominant before the first pane.
2. **Surface structure:** sparse cool points appear inside the silhouette after the first pane.
3. **Aligned representation:** cyan and restrained amber points become dominant after the second pane.
4. **Predictive state:** three masked point layers with different point scale, opacity, and small positional offsets create a volumetric reading after the third pane.

The point layers use the approved rabbit PNG's alpha as their exact CSS mask. Every visible mark therefore remains inside the rabbit silhouette; no generated point-cloud raster, canvas, WebGL renderer, 3D dependency, or particle system is used. The point texture may be an embedded SVG pattern owned by the component. Its apparent depth comes from three registered layers—far, middle, and near—not from perpetual animation. Scroll progress alone controls their opacity and offset, so pausing and reversing the scroll freezes and reverses the transformation exactly.

Inside each pane cross-section, the narrow clipped slice shows the next representation state slightly ahead of the main body. The physical rabbit width does not expand; the glass slice is visibly thick enough to show the transition while remaining much narrower than the rabbit.

## Scroll Mapping

The section remains in normal document flow.

- Progress is `0` when the section's top reaches 85% of the viewport height.
- Progress is `1` when the section's bottom reaches 25% of the viewport height.
- Progress is linear and clamped between `0` and `1`.
- The rabbit begins inside the left side of the apparatus window, before the first pane, and ends just beyond the third pane. It never crosses the title or body copy.
- Stopping the scroll freezes the subject at the current position.
- Scrolling upward reverses the exact path.
- The three pane interactions occur in spatial order as the subject intersects them; they are not separately timed entrance effects.
- The representation state advances in the same spatial order: photographic before pane one, progressively abstract inside the panes, and point-based after pane three.
- The heading, description, and interest labels remain static and readable throughout.

The motion controller uses one passive `scroll` listener and one resize signal. It schedules at most one `requestAnimationFrame` update at a time, reads the section rectangle once per update, and writes a single normalized progress value. It has no perpetual animation loop, stored history, replay state, or external dependency.

## Responsive Behavior

### Desktop and tablet

- Preserve the approved left-copy/right-apparatus composition.
- Keep the full three-pane travel distance.
- The aperture ellipse keeps the subject entirely inside the apparatus window, with the base image's circular ring providing natural edge occlusion.

### Mobile

- Place semantic text above a dedicated scene stage rather than overlaying the travel path.
- Use the same photographic sources with an independent crop.
- Keep all three panes visible where the viewport permits; reduce travel distance rather than shrinking the rabbit until it becomes illegible.
- The rabbit must not overlap the title, description, or labels at any scroll position.

### Reduced motion and script failure

- With `prefers-reduced-motion: reduce`, do not register scroll motion. Display the approved static middle state with the rabbit between the second and third panes.
- Without JavaScript, render the same complete static middle state. No content or illustration may start hidden.

## Component Boundaries

`ResearchInterests.astro` continues to own semantic copy, scene markup, responsive layout, the aperture ellipse, depth order, the alpha-masked point layers, and component-scoped styles. The homepage route supplies explicit image metadata only for the base, rabbit, and three pane overlays; it must not import or pass an independent foreground or point-cloud image.

A page-local controller owns only scroll-to-progress calculation and cleanup. CSS consumes the normalized progress to position the subject and its clipped refraction copies. No shared layout, navigation, secondary route, global transition, or typography token changes are included.

## Performance Constraints

- Responsive AVIF and WebP remain the delivery formats for photographic layers.
- The complete normal modern-browser scene path must remain at or below 300 KiB.
- The page-local motion controller must remain at or below 2 KiB gzip.
- Homepage mobile Lighthouse performance must remain at least 95.
- Total blocking time must remain at or below 50 ms and CLS at or below 0.03.
- No animation library, canvas renderer, WebGL/3D engine, video, sprite sequence, particle library, or client-side router is introduced.

## Verification

### Automated

- Progress is `0` and `1` at the specified viewport boundaries and is clamped outside them.
- Forward scroll increases progress; reverse scroll decreases it.
- Multiple scroll events before a frame schedule only one update.
- Disconnect removes listeners and cancels pending work.
- Reduced-motion mode registers no scroll motion and renders the static state.
- Production output contains the four depth groups—base, aperture-clipped subject, refractions, and pane overlays—plus genuine raster pane assets and no visible CSS pane borders or independent foreground raster.
- The subject contains one photographic layer and exactly three alpha-masked point-depth layers; the source imports no generated point-cloud raster and no 3D or particle dependency.
- The rejected stock rabbit and previous one-time entered-state controller are absent.
- Source and production builds pass without mock assets in production paths.

### Browser

Test by loading the homepage at the top and scrolling naturally through the section, not by inspecting only the final DOM state.

At 1440, 768, 390, and 320 pixel widths, verify:

- the static composite matches the approved visual direction before motion testing;
- forward, pause, and reverse behavior are visible and deterministic;
- the rabbit crosses all three panes without leaving the apparatus window;
- pane reflection, thickness, and slight refraction read as physical glass rather than outlined rectangles, while the base ring supplies natural aperture-edge occlusion;
- the rabbit does not read as a pasted cutout;
- the rabbit is plainly photographic before the panes and plainly point-based after them, with the transition confined to its silhouette;
- near, middle, and far point layers create depth without a perpetual loop, glow, or marks outside the rabbit;
- text never collides with the scene;
- reduced-motion and JavaScript-disabled modes show the intended static state;
- there is no horizontal overflow or console error.

## Explicit Exclusions

- changes outside the homepage research-interest section;
- sticky pinning or scroll hijacking;
- looping, bouncing, spring, pointer, gyroscope, or replay effects;
- free-floating decorative particles, glow, HUD graphics, or science-fiction styling outside the rabbit silhouette;
- dark mode, custom cursor, loader, global page transition, or new route;
- pre-rendered frame sequences, video, or a repaired CSS-pane version of the rejected composition.
- an independent foreground raster or duplicate ring/fastener overlay.
- a generated point-cloud PNG, canvas/WebGL renderer, or runtime particle simulation.
