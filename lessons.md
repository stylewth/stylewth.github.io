# Lessons

- Restoring focus after closing a dialog must not reuse the hover transform. Keep the card at its base position and show keyboard focus with a non-positional indicator such as an outline.
- Stacked cards need an explicit caption height sized for the longest maintained metadata. `min-height` still allows long creator names to change the card size.
- Layered editorial scenes must be reviewed as one composite, not as individually valid assets: match subject lighting, scale, perspective, and edge treatment so the subject does not read as a pasted cutout, and make glass layers visibly communicate material rather than plain outlined rectangles.
- Motion verification must reproduce the user's real entry path and confirm a perceptible before/after sequence; checking only the final DOM state or transition attributes is insufficient.
- For conceptual transformations, optimize for a clear visual state change rather than literal simulation: a lightweight alpha-masked layered illustration can communicate volumetric point-cloud depth without a real 3D renderer, provided every mark stays inside the subject silhouette.
- Verify point-pattern changes at the subject's actual rendered size; never hand-write HTML entities in inline CSS URLs, and include mask assets in the scene budget.
