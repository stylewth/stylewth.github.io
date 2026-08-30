export interface TraversalGeometry {
  top: number;
  bottom: number;
  viewportHeight: number;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function calculateTraversalProgress({
  top,
  bottom,
  viewportHeight,
}: TraversalGeometry): number {
  const sectionHeight = bottom - top;
  if (viewportHeight <= 0 || sectionHeight <= 0) {
    throw new RangeError('Traversal geometry must have positive dimensions');
  }

  const start = viewportHeight * 0.85;
  const end = viewportHeight * 0.25;
  return clamp((start - top) / (sectionHeight + start - end));
}

export function formatProgressPercent(progress: number): string {
  const percent = Math.round(clamp(progress) * 100_000) / 1_000;
  return `${percent}%`;
}
