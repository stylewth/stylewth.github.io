import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const language = z.literal('en');
const links = z.object({
  overview: z.url().optional(),
  paper: z.url().optional(),
  code: z.url().optional(),
  demo: z.url().optional(),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().trim().min(1),
        slug: z.string().trim().min(1),
        translationKey: z.string().trim().min(1),
        summary: z.string().trim().min(1),
        year: z.number().int().min(1900),
        kind: z.enum(['research', 'engineering', 'competition']),
        stage: z.enum(['ongoing', 'completed', 'preprint', 'published']),
        topics: z.array(z.string().trim().min(1)).min(1),
        featured: z.boolean(),
        featuredOrder: z.number().int().positive().optional(),
        role: z.string().trim().min(1),
        links: links.default({}),
        heroImage: image().optional(),
        heroImageAlt: z.string().trim().min(1).optional(),
        lang: language,
      })
      .superRefine((project, context) => {
        if (project.featured && !project.featuredOrder) {
          context.addIssue({
            code: 'custom',
            message: 'featuredOrder is required when featured is true',
            path: ['featuredOrder'],
          });
        }
        if (project.heroImage && !project.heroImageAlt) {
          context.addIssue({
            code: 'custom',
            message: 'heroImageAlt is required when heroImage is provided',
            path: ['heroImageAlt'],
          });
        }
      }),
});

const updates = defineCollection({
  loader: glob({ base: './src/content/updates', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().trim().min(1),
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    summary: z.string().trim().min(1),
    translationKey: z.string().trim().min(1),
    kind: z.enum(['project', 'paper', 'talk', 'award', 'internship', 'milestone']),
    url: z.url().optional(),
    lang: language,
  }),
});

const elsewhere = defineCollection({
  loader: glob({ base: './src/content/elsewhere', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().trim().min(1),
        date: z.coerce.date(),
        translationKey: z.string().trim().min(1),
        summary: z.string().trim().min(1),
        kind: z.enum(['music', 'film', 'note']),
        tags: z.array(z.string().trim().min(1)).min(1),
        externalUrl: z.url().optional(),
        cover: image().optional(),
        coverAlt: z.string().trim().min(1).optional(),
        lang: language,
      })
      .superRefine((entry, context) => {
        if (entry.cover && !entry.coverAlt) {
          context.addIssue({
            code: 'custom',
            message: 'coverAlt is required when cover is provided',
            path: ['coverAlt'],
          });
        }
      }),
});

export const collections = {
  projects,
  updates,
  elsewhere,
};
