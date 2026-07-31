import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { elsewhereDateSchema } from './content-schema';

const obsoleteArtworkFields = [
  'cover',
  'coverSourceUrl',
  'coverCredit',
  'editionNote',
] as const;

function favoriteFrontmatter(kind: 'film' | 'album') {
  const directory = join(process.cwd(), 'src', 'content', 'favorites', kind);
  return readdirSync(directory)
    .filter((filename) => filename.endsWith('.md'))
    .sort()
    .map((filename) => matter(readFileSync(join(directory, filename), 'utf8')).data);
}

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

describe('favorite provider content contract', () => {
  it('requires a positive TMDB ID on films and rejects Spotify URLs', () => {
    const films = favoriteFrontmatter('film');

    expect(films).toHaveLength(10);
    for (const film of films) {
      expect(film.kind).toBe('film');
      expect(film.tmdbId).toBeTypeOf('number');
      expect(Number.isInteger(film.tmdbId) && film.tmdbId > 0).toBe(true);
      expect(film).not.toHaveProperty('spotifyUrl');
    }
  });

  it('requires a canonical Spotify album URL on albums and rejects TMDB IDs', () => {
    const albums = favoriteFrontmatter('album');

    expect(albums).toHaveLength(10);
    for (const album of albums) {
      expect(album.kind).toBe('album');
      expect(album.spotifyUrl).toMatch(
        /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]+$/,
      );
      expect(album).not.toHaveProperty('tmdbId');
    }
  });

  it('rejects obsolete local artwork metadata from every favorite', () => {
    const favorites = [...favoriteFrontmatter('film'), ...favoriteFrontmatter('album')];

    expect(favorites).toHaveLength(20);
    for (const favorite of favorites) {
      for (const field of obsoleteArtworkFields) {
        expect(favorite).not.toHaveProperty(field);
      }
    }
  });
});
