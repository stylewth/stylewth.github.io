type LanguageEntry = {
  id: string;
  data: {
    lang: string;
  };
};

type ProjectOrderingEntry = LanguageEntry & {
  data: LanguageEntry['data'] & {
    featured: boolean;
    featuredOrder?: number;
    year: number;
  };
};

type UpdateEntry = LanguageEntry & {
  data: LanguageEntry['data'] & {
    date: string;
  };
};

type ProjectKeyEntry = LanguageEntry & {
  data: LanguageEntry['data'] & {
    slug: string;
    translationKey: string;
  };
};

export function selectFeaturedProjects<T extends ProjectOrderingEntry>(
  entries: readonly T[],
  lang: string,
  limit: number,
): T[] {
  return [...entries]
    .filter((entry) => entry.data.lang === lang && entry.data.featured)
    .sort(
      (a, b) =>
        (a.data.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.data.featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
        b.data.year - a.data.year ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

export function sortUpdatesNewestFirst<T extends UpdateEntry>(
  entries: readonly T[],
  lang: string,
): T[] {
  return [...entries]
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

export function sortProjectsForArchive<T extends ProjectOrderingEntry>(
  entries: readonly T[],
  lang: string,
): T[] {
  return [...entries]
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      if (a.data.featured && b.data.featured) {
        return (a.data.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.data.featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
          b.data.year - a.data.year ||
          a.id.localeCompare(b.id);
      }
      return b.data.year - a.data.year || a.id.localeCompare(b.id);
    });
}

export function assertUniqueProjectKeys(entries: readonly ProjectKeyEntry[]): void {
  const slugs = new Set<string>();
  const translationKeys = new Set<string>();

  for (const entry of entries) {
    const slugKey = `${entry.data.lang}:${entry.data.slug}`;
    const translationKey = `${entry.data.lang}:${entry.data.translationKey}`;
    if (slugs.has(slugKey)) {
      throw new Error(
        `Duplicate project slug "${entry.data.slug}" for language "${entry.data.lang}"`,
      );
    }
    if (translationKeys.has(translationKey)) {
      throw new Error(
        `Duplicate project translationKey "${entry.data.translationKey}" for language "${entry.data.lang}"`,
      );
    }
    slugs.add(slugKey);
    translationKeys.add(translationKey);
  }
}
