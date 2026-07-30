import { describe, expect, it } from 'vitest';
import {
  assertUniqueProjectKeys,
  selectFeaturedProjects,
  sortProjectsForArchive,
  sortUpdatesNewestFirst,
} from './content';
import { en } from '../i18n/en';

describe('selectFeaturedProjects', () => {
  it('filters by language and orders featured records without mutating input', () => {
    const records = [
      { id: 'b', data: { lang: 'en', featured: true, featuredOrder: 2, year: 2026 } },
      { id: 'zh', data: { lang: 'zh', featured: true, featuredOrder: 1, year: 2026 } },
      { id: 'a', data: { lang: 'en', featured: true, featuredOrder: 1, year: 2026 } },
      { id: 'hidden', data: { lang: 'en', featured: false, year: 2026 } },
    ];
    expect(selectFeaturedProjects(records, 'en', 3).map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(records.map((entry) => entry.id)).toEqual(['b', 'zh', 'a', 'hidden']);
  });
});

describe('sortUpdatesNewestFirst', () => {
  it('sorts dates descending and same-month IDs ascending', () => {
    const records = [
      { id: '2026-05-02-award', data: { lang: 'en', date: '2026-05' } },
      { id: '2026-06-01-project', data: { lang: 'en', date: '2026-06' } },
      { id: '2026-05-01-project', data: { lang: 'en', date: '2026-05' } },
    ];
    expect(sortUpdatesNewestFirst(records, 'en').map((entry) => entry.id)).toEqual([
      '2026-06-01-project',
      '2026-05-01-project',
      '2026-05-02-award',
    ]);
  });
});

describe('sortProjectsForArchive', () => {
  it('filters by language, orders every archive tier, and does not mutate input', () => {
    const records = [
      { id: 'same-year-b', data: { lang: 'en', featured: false, year: 2025 } },
      { id: 'zh-featured', data: { lang: 'zh', featured: true, featuredOrder: 0, year: 2028 } },
      { id: 'dynamic-evrp', data: { lang: 'en', featured: true, featuredOrder: 2, year: 2026 } },
      { id: 'newest-unfeatured', data: { lang: 'en', featured: false, year: 2027 } },
      { id: 'sparse-navwm', data: { lang: 'en', featured: true, featuredOrder: 1, year: 2026 } },
      { id: 'older-unfeatured', data: { lang: 'en', featured: false, year: 2024 } },
      { id: 'same-year-a', data: { lang: 'en', featured: false, year: 2025 } },
    ];
    const originalIds = records.map((entry) => entry.id);

    expect(sortProjectsForArchive(records, 'en').map((entry) => entry.id)).toEqual([
      'sparse-navwm',
      'dynamic-evrp',
      'newest-unfeatured',
      'same-year-a',
      'same-year-b',
      'older-unfeatured',
    ]);
    expect(records.map((entry) => entry.id)).toEqual(originalIds);
  });
});

describe('assertUniqueProjectKeys', () => {
  it('rejects duplicate slugs within one language', () => {
    expect(() =>
      assertUniqueProjectKeys([
        { id: 'one', data: { lang: 'en', slug: 'same', translationKey: 'one' } },
        { id: 'two', data: { lang: 'en', slug: 'same', translationKey: 'two' } },
      ]),
    ).toThrow('Duplicate project slug "same" for language "en"');
  });

  it('allows the same slug in a different language', () => {
    expect(() =>
      assertUniqueProjectKeys([
        { id: 'en', data: { lang: 'en', slug: 'same', translationKey: 'project' } },
        { id: 'zh', data: { lang: 'zh', slug: 'same', translationKey: 'project' } },
      ]),
    ).not.toThrow();
  });
});

describe('English UI copy', () => {
  it('uses the approved navigation and research statements', () => {
    expect(en.navigation).toEqual({
      home: 'Home',
      work: 'Work',
      updates: 'Updates',
      elsewhere: 'Elsewhere',
    });
    expect(en.profile.role).toBe(
      'Undergraduate in Artificial Intelligence at South China University of Technology',
    );
    expect(en.research.statement).toBe('Learning internal worlds from partial views.');
    expect(en.research.interests).toEqual([
      'World representations',
      'Multimodal grounding',
      'Predictive planning',
    ]);
  });
});
