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

The rabbit, pane material, environment, and apparatus must be generated or reconstructed as parts of the same scene. An unrelated stock animal is not an acceptable substitute. If a required transparent layer cannot be produced with genuine alpha, implementation stops at the composition gate instead of introducing a fallback asset.

## Photographic Layer Model

The final scene uses five explicit depth groups:

1. **Environment and rear apparatus:** sky, ground, distant geometry, and rear portions of the device.
2. **Rabbit subject:** one horizontal white rabbit with scene-matched light, color temperature, perspective, grain, and edge softness.
3. **Pane refraction regions:** clipped copies of the subject visible only within the three pane interiors, offset by no more than 2 pixels to create restrained optical displacement.
4. **Physical pane overlays:** genuine transparent raster layers containing reflection, faint tint, edge thickness, and surface variation. CSS may position these layers but must not draw their visible borders or material.
5. **Front apparatus occluder:** the near rim, fasteners, and foreground metal that must naturally cover the moving subject where geometry requires it.

The clipped refraction regions are invisible masks, not visible rectangular UI. They may adjust only transform and opacity; no animated blur, glow, hue shift, or filter effect is allowed.

## Scroll Mapping

The section remains in normal document flow.

- Progress is `0` when the section's top reaches 85% of the viewport height.
- Progress is `1` when the section's bottom reaches 25% of the viewport height.
- Progress is linear and clamped between `0` and `1`.
- The rabbit begins inside the left side of the apparatus window, before the first pane, and ends just beyond the third pane. It never crosses the title or body copy.
- Stopping the scroll freezes the subject at the current position.
- Scrolling upward reverses the exact path.
- The three pane interactions occur in spatial order as the subject intersects them; they are not separately timed entrance effects.
- The heading, description, and interest labels remain static and readable throughout.

The motion controller uses one passive `scroll` listener and one resize signal. It schedules at most one `requestAnimationFrame` update at a time, reads the section rectangle once per update, and writes a single normalized progress value. It has no perpetual animation loop, stored history, replay state, or external dependency.

## Responsive Behavior

### Desktop and tablet

- Preserve the approved left-copy/right-apparatus composition.
- Keep the full three-pane travel distance.
- The subject remains entirely inside the apparatus window and behind the foreground rim.

### Mobile

- Place semantic text above a dedicated scene stage rather than overlaying the travel path.
- Use the same photographic sources with an independent crop.
- Keep all three panes visible where the viewport permits; reduce travel distance rather than shrinking the rabbit until it becomes illegible.
- The rabbit must not overlap the title, description, or labels at any scroll position.

### Reduced motion and script failure

- With `prefers-reduced-motion: reduce`, do not register scroll motion. Display the approved static middle state with the rabbit between the second and third panes.
- Without JavaScript, render the same complete static middle state. No content or illustration may start hidden.

## Component Boundaries

`ResearchInterests.astro` continues to own semantic copy, scene markup, responsive layout, depth order, and component-scoped styles. The homepage route supplies explicit image metadata for the base, rabbit, pane overlays, and foreground occluder.

A page-local controller owns only scroll-to-progress calculation and cleanup. CSS consumes the normalized progress to position the subject and its clipped refraction copies. No shared layout, navigation, secondary route, global transition, or typography token changes are included.

## Performance Constraints

- Responsive AVIF and WebP remain the delivery formats for photographic layers.
- The complete normal modern-browser scene path must remain at or below 300 KiB.
- The page-local motion controller must remain at or below 2 KiB gzip.
- Homepage mobile Lighthouse performance must remain at least 95.
- Total blocking time must remain at or below 50 ms and CLS at or below 0.03.
- No animation library, canvas renderer, video, sprite sequence, or client-side router is introduced.

## Verification

### Automated

- Progress is `0` and `1` at the specified viewport boundaries and is clamped outside them.
- Forward scroll increases progress; reverse scroll decreases it.
- Multiple scroll events before a frame schedule only one update.
- Disconnect removes listeners and cancels pending work.
- Reduced-motion mode registers no scroll motion and renders the static state.
- Production output contains the five depth groups, genuine raster pane assets, and no visible CSS pane borders.
- The rejected stock rabbit and previous one-time entered-state controller are absent.
- Source and production builds pass without mock assets in production paths.

### Browser

Test by loading the homepage at the top and scrolling naturally through the section, not by inspecting only the final DOM state.

At 1440, 768, 390, and 320 pixel widths, verify:

- the static composite matches the approved visual direction before motion testing;
- forward, pause, and reverse behavior are visible and deterministic;
- the rabbit crosses all three panes without leaving the apparatus window;
- pane reflection, thickness, occlusion, and slight refraction read as physical glass rather than outlined rectangles;
- the rabbit does not read as a pasted cutout;
- text never collides with the scene;
- reduced-motion and JavaScript-disabled modes show the intended static state;
- there is no horizontal overflow or console error.

## Explicit Exclusions

- changes outside the homepage research-interest section;
- sticky pinning or scroll hijacking;
- looping, bouncing, spring, pointer, gyroscope, or replay effects;
- decorative particles, glow, HUD graphics, or science-fiction styling;
- dark mode, custom cursor, loader, global page transition, or new route;
- pre-rendered frame sequences, video, or a repaired CSS-pane version of the rejected composition.
