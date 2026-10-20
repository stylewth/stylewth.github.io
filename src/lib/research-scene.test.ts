import { describe, expect, it } from 'vitest';
import { apertureOutline, rabbitTrack, scenePanes } from './research-scene';

function insideRim(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = apertureOutline.length - 1; i < apertureOutline.length; j = i++) {
    const [xi, yi] = apertureOutline[i];
    const [xj, yj] = apertureOutline[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

describe('registered research scene geometry', () => {
  it('keeps every complete glass pane inside the photographed inner rim', () => {
    for (const pane of scenePanes) {
      for (const x of [pane.x, pane.exit]) {
        for (const y of [pane.y, pane.y + pane.height]) {
          expect(insideRim(x, y), `pane corner ${x}, ${y}`).toBe(true);
        }
      }
    }
  });

  it('preserves the source glass aspect ratios while increasing their projected size with depth', () => {
    scenePanes.forEach((pane, i) => {
      expect(pane.width / pane.crop.width).toBeCloseTo(pane.height / pane.crop.height, 10);
      if (i) {
        expect(pane.height).toBeGreaterThan(scenePanes[i - 1].height);
        expect(pane.x).toBeGreaterThan(scenePanes[i - 1].exit);
      }
    });
  });

  it('crosses all three panes on the same horizontal path with room to enter and leave', () => {
    expect(rabbitTrack.start + rabbitTrack.width / 2).toBeLessThan(scenePanes[0].x);
    expect(rabbitTrack.end - rabbitTrack.width / 2).toBeGreaterThan(scenePanes[2].exit);
    for (const pane of scenePanes) {
      expect(rabbitTrack.centerY - rabbitTrack.width / 3).toBeGreaterThan(pane.y);
      expect(rabbitTrack.centerY + rabbitTrack.width / 3).toBeLessThan(pane.y + pane.height);
      expect(insideRim(pane.x, rabbitTrack.centerY)).toBe(true);
      expect(insideRim(pane.exit, rabbitTrack.centerY)).toBe(true);
    }
  });
});
