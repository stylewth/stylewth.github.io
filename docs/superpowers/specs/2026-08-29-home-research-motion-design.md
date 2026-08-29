# Home Research Motion Design

Date: 2026-08-29  
Owner: Tenghao Wang  
Scope: homepage research-interest section only

## Goal

Turn the existing static research-interest artwork into one restrained, scroll-triggered composition that makes the research theme feel deliberate without changing the site's academic editorial character.

This iteration does not add content or new routes. It preserves the current homepage profile, typography, palette, navigation, work and update sections, and every secondary page.

## Approved Direction

Use a hybrid layered composition:

1. a wide editorial-photographic base image containing the environment, ground, and scientific apparatus;
2. a separate transparent rabbit subject layer;
3. observation slices drawn as lightweight HTML and CSS layers;
4. existing research copy rendered as normal semantic HTML above the artwork.

The visual direction remains warm white, bone, and light gray, with soft natural light and credible physical materials. The result should resemble editorial research photography rather than a technology-company hero. It must avoid neon light, cyberpunk styling, HUD graphics, glowing data streams, decorative particles, and science-fiction spectacle.

## Alternatives Considered

| Approach | Advantage | Limitation | Decision |
|---|---|---|---|
| Animate the current flattened image | Lowest implementation cost | Apparatus, rabbit, and slices cannot move independently | Rejected |
| Split every visible element into raster layers | Maximum independent control | More assets, more compositing risk, and higher transfer cost | Rejected |
| Base raster, transparent subject, CSS slices | Clear depth, small asset count, controllable animation | Requires one new base image and one clean cutout | Selected |

## Static Composition Gate

Before animation implementation, create one static composite preview that proves:

- the apparatus and rabbit read clearly at desktop width;
- the title area retains sufficient negative space and contrast;
- the observation slices add depth without obscuring the subject;
- the composition still feels calm when viewed without motion;
- a mobile crop can retain the subject and title without overlap.

The preview must be reviewed before deriving final layers or changing website code.

## Motion Behavior

The animation starts once per page load when the research section first enters the viewport. It completes on a fixed timeline rather than tracking every scroll pixel.

Sequence:

1. the base image fades in with a small upward translation;
2. the rabbit subject settles into place with a slightly delayed translation;
3. the observation slices reveal in a short stagger;
4. the heading, description, and three research-interest labels appear in sequence.

Motion constraints:

- total visible sequence duration: 500 to 700 milliseconds;
- individual translations: 12 to 20 pixels;
- desktop background parallax: no more than 3% of the section height;
- animate only `transform` and `opacity`;
- no bounce, spring, glow, blur animation, continuous loop, pointer tracking, gyroscope input, or replay after leaving and re-entering the viewport.

## Responsive Behavior

Desktop keeps the existing full-width second-screen composition and the complete layer sequence.

Mobile uses the same source assets with independent crop and layer positions. It removes background parallax and retains only the short fade, subject translation, and slice reveal. The navigation and other homepage sections remain unchanged.

When `prefers-reduced-motion: reduce` is active, all layers render immediately in their final static positions. The complete text and illustration remain available when JavaScript fails.

## Component Boundaries

`ResearchInterests.astro` continues to own the section's semantic content and layout. It receives the base and subject image metadata as explicit props.

A small page-local script owns only one responsibility: observe the research section and add its entered state once. The unenhanced markup renders the final static state. When motion is allowed, the script marks the section as motion-ready before observing it, applies the entered state on the first intersection, then disconnects the observer. It stores no persistent data and does not query content collections.

Component-scoped CSS owns layer placement, animation timing, responsive changes, and reduced-motion behavior. Shared duration and easing tokens may enter `src/styles/tokens.css` only if they are actually reused.

The dependency direction remains:

```text
page assets and localized copy
    -> homepage route props
    -> ResearchInterests markup
    -> page-local observation state
    -> component-scoped CSS transition
```

No framework, animation package, particle engine, or client-side router is introduced.

## Asset Delivery

- Generate and approve a static composite before producing final layers.
- Export the base as responsive AVIF and WebP through Astro's image pipeline.
- Export the rabbit with a genuine transparent background and preserve its alpha channel.
- Draw observation slices in HTML and CSS instead of baking them into additional raster files.
- Keep the research artwork lazy-loaded because it begins below the academic profile.
- Keep the additional interaction script at or below 2 KiB after gzip compression.
- Keep the complete research-section transfer cost at or below 300 KiB on a normal modern browser path.

## Failure Behavior

If the observer script does not run, the section displays its final static state. Missing or invalid production assets must fail the build instead of silently substituting the old composite or a placeholder. Reduced-motion mode is a first-class static presentation, not an approximation of the animated state.

## Verification

Automated checks must cover:

- the section renders the base, subject, observation slices, and semantic copy;
- the observer adds the entered state only once;
- the initial state cannot hide content when JavaScript is unavailable;
- reduced-motion CSS removes transitions and parallax;
- no animation dependency is added;
- the production build and existing site-output contracts still pass.

Browser QA must cover 1440, 768, 390, and 320 pixel widths, keyboard navigation, JavaScript-disabled rendering, and reduced-motion rendering. There must be no horizontal page overflow or text-artwork collision.

Current Lighthouse baselines from the production build are:

| Page and profile | Performance | LCP | Total blocking time | CLS |
|---|---:|---:|---:|---:|
| Home, mobile | 99 | 1.7 s | 0 ms | 0 |
| Home, desktop | 100 | 0.5 s | 0 ms | 0.003 |
| Elsewhere, mobile | 93 | 3.3 s | 0 ms | 0.034 |

After implementation, the homepage mobile performance score must remain at least 95, total blocking time must not exceed 50 milliseconds, and CLS must not exceed 0.03. This iteration does not otherwise optimize site performance.

## Explicit Exclusions

- new content or routes;
- CV, Publications, or Chinese placeholders;
- global page transitions;
- dark mode;
- custom cursor;
- loading screen;
- sticky navigation or scroll progress UI;
- persistent particles or animated character;
- visual changes outside the homepage research section.
