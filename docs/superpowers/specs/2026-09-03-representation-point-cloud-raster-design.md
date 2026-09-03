# Representation and Point-Cloud Raster Design

Date: 2026-09-03  
Scope: homepage research traversal, second-to-third pane and post-third-pane rabbit states

## Decision

Replace the current procedural SVG/CSS textures for the aligned-representation and final point-cloud states with two generated transparent raster assets. This user-approved decision supersedes the earlier prohibition on generated representation and point-cloud rasters in the 2026-08-30 and 2026-08-31 traversal specifications. The observation state, first transformation, glass assets, rabbit travel path, and scroll mapping remain unchanged.

## Shared Registration

Both new assets use `research-traversal-rabbit.png` as the edit target and must preserve its canvas, pose, direction, scale, and outer silhouette. They must have genuine RGBA transparency outside the rabbit. Checkerboard pixels, colored matte, halos, shadows, glow, and particles outside the silhouette are prohibited.

The assets replace only the interior appearance of the rabbit. They must remain spatially registered with the photographic observation state so glass crossings do not produce silhouette jumps.

## Aligned Representation State

The state visible between the second and third panes represents an internal learned representation rather than a point cloud.

- Use a cool cyan and blue-green base with restrained amber accents.
- Combine continuous translucent surface bands, localized feature nodes, and short aligned encoding paths.
- Show layered internal structure and moderate depth while keeping the rabbit immediately recognizable.
- Avoid a uniform grid, repeated wallpaper pattern, circuitry, HUD graphics, wireframe-only rendering, and free-floating marks.
- Keep the full rabbit, including the eye region, stylistically integrated into the representation rather than retaining an isolated photographic eye.

## Reconstructed Point-Cloud State

The state after the third pane is a reconstructed volumetric point-cloud rabbit.

- Build the complete rabbit from point clusters; do not retain photographic fur or a photographic eye.
- Use three readable depth populations: small muted far points, medium cyan middle points, and larger bone/amber near points.
- Vary point scale, density, overlap, illumination, and local occlusion so the body reads as a solid three-dimensional volume rather than a flat dotted silhouette.
- Keep the outer silhouette stable and clean, with denser points at important anatomical features and softer density changes across rounded body volumes.
- Avoid voxels, polygon mesh lines, neon glow, black background, ground shadow, checkerboard pixels, and particles beyond the silhouette.

## Generation and Review

Use the built-in image generation editor with the current transparent rabbit as the primary edit target. Generate the two states separately so each prompt can focus on its own visual logic. Preserve the returned alpha channels and save selected project assets alongside the existing traversal images using new versioned filenames.

Before integration, verify each PNG programmatically for four channels, an alpha range containing both 0 and 255, and transparent corner pixels. Then present both generated assets in a local side-by-side browser preview against a neutral checkerboard and dark/light backgrounds. Integration begins only after visual approval.

## Integration

After approval, replace the `aligned` and `point-cloud` procedural state renderers in `ResearchRabbitState.astro` with responsive image rendering. Continue using the existing rabbit alpha mask and pane clipping model. The new raster assets must not introduce independent motion, canvas, WebGL, particle libraries, or changes to the scroll controller.

## Verification

- Both source assets are genuine RGBA images with transparent exterior pixels.
- Their canvas dimensions and visible silhouette align with the observation rabbit.
- The aligned state reads as learned representation and is visually distinct from the point cloud.
- The final state reads as a volumetric three-dimensional point reconstruction.
- Forward and reverse pane crossings remain spatially registered without silhouette jumps.
- No visible marks appear outside the rabbit at any viewport size.
- Existing traversal progress, reduced-motion, responsive, build, and browser checks continue to pass.

## Exclusions

- Regenerating the base apparatus, glass panes, or observation rabbit.
- Changing the page layout, copy, typography, traversal timing, or pane geometry.
- Adding ambient particles, looping animation, glow, HUD decoration, or a real-time 3D renderer.
