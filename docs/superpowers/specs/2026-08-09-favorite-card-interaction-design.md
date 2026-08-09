# Favorite card interaction refinement

## Goal

Make the favorite-card fan stable under a stationary pointer and give selection feedback a restrained, tactile paper-card quality without changing content, layout, or interaction semantics.

## Root cause

The current hover selector transforms `.favorite-card`, which is also the pointer hit target. Near an edge, lifting that element moves the hit target away from the pointer, removes `:hover`, returns the card, and can start the cycle again. The same transition also removes the full fan rotation in 180ms, making the response feel abrupt.

## Interaction design

- Keep `.favorite-card` fixed at its fan position. It owns the stable pointer hit area and stacking context.
- Animate `.favorite-card__trigger` only. Hover lifts it by `0.7rem`, scales it to `1.018`, softens most of its fan rotation, strengthens the border, and adds a layered paper shadow.
- Use a 260ms emphasized ease for lift and rotation, with a slightly longer shadow fade. Avoid bounce or overshoot.
- Pressing a card reduces the lift and scale so selection feels deliberate.
- Keyboard focus uses the existing inset outline without positional movement.
- The modal enters with a short opacity, translate, and scale transition; its backdrop fades independently.
- Under `prefers-reduced-motion: reduce`, remove all positional and opacity animation while keeping the selected visual state legible.

## Accessibility and compatibility

No DOM roles, focus restoration, dialog behavior, or tab behavior change. Enhancement remains CSS-gated by `favorites-stage[data-enhanced]`. The no-JavaScript grid remains untouched.

## Verification

- A source regression test must fail while hover transforms `.favorite-card` and pass only when the outer hit target remains static and the inner trigger carries the hover transform.
- Tests must assert press feedback, dialog entry styling, and reduced-motion neutralization.
- Run the targeted contract test, component tests, Astro check, and production build.
