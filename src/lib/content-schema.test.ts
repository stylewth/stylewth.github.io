import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import { describe, expect, it } from 'vitest';
import { elsewhereDateSchema } from './content-schema';

describe('Elsewhere date schema', () => {
  it('receives the real Elsewhere frontmatter date as a canonical string', () => {
    const source = readFileSync(
      join(process.cwd(), 'src', 'content', 'elsewhere', 'four-ways-of-listening.md'),
      'utf8',
    );
    const { frontmatter } = parseFrontmatter(source);

    expect(frontmatter.date).toBe('2026-07-31');
    expect(elsewhereDateSchema.safeParse(frontmatter.date).success).toBe(true);
  });

  it('parses an ISO leap day as midnight UTC', () => {
    const result = elsewhereDateSchema.safeParse('2024-02-29');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(new Date('2024-02-29T00:00:00.000Z'));
    }
  });

  it.each([
    '2026-7-1',
    '2026/07/01',
    '2026-02-30',
    '2026-07-01T00:00:00.000Z',
  ])(
    'rejects the non-canonical or impossible date %s',
    (date) => {
      expect(elsewhereDateSchema.safeParse(date).success).toBe(false);
    },
  );

  it('rejects an impossible date that YAML has normalized to a Date object', () => {
    const { frontmatter } = parseFrontmatter('---\ndate: 2026-02-30\n---\n');

    expect(frontmatter.date).toBeInstanceOf(Date);
    expect(elsewhereDateSchema.safeParse(frontmatter.date).success).toBe(false);
  });
});
