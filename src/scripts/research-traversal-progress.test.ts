import { describe, expect, it } from 'vitest';
import { calculateTraversalProgress, formatProgressPercent } from './research-traversal-progress';

describe('calculateTraversalProgress', () => {
  it('runs only while the rabbit is visible in the viewport', () => {
    expect(calculateTraversalProgress({ top: 1000, bottom: 1200, viewportHeight: 1000 })).toBe(0);
    expect(calculateTraversalProgress({ top: 400, bottom: 600, viewportHeight: 1000 })).toBe(0.5);
    expect(calculateTraversalProgress({ top: -200, bottom: 0, viewportHeight: 1000 })).toBe(1);
  });

  it('clamps progress before and after the traversal range', () => {
    expect(calculateTraversalProgress({ top: 1100, bottom: 1300, viewportHeight: 1000 })).toBe(0);
    expect(calculateTraversalProgress({ top: -300, bottom: -100, viewportHeight: 1000 })).toBe(1);
  });

  it('rejects invalid viewport and section geometry', () => {
    expect(() => calculateTraversalProgress({ top: 0, bottom: 1, viewportHeight: 0 })).toThrow(RangeError);
    expect(() => calculateTraversalProgress({ top: 10, bottom: 10, viewportHeight: 1000 })).toThrow(RangeError);
  });

  it('formats normalized progress as a stable CSS percentage', () => {
    expect(formatProgressPercent(0)).toBe('0%');
    expect(formatProgressPercent(0.423456)).toBe('42.346%');
    expect(formatProgressPercent(1)).toBe('100%');
  });
});
