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
  const subjectHeight = bottom - top;
  if (viewportHeight <= 0 || subjectHeight <= 0) {
    throw new RangeError('Traversal geometry must have positive dimensions');
  }

  return clamp((viewportHeight - top) / (viewportHeight + subjectHeight));
}

export function formatProgressPercent(progress: number): string {
  const percent = Math.round(clamp(progress) * 100_000) / 1_000;
  return `${percent}%`;
}
