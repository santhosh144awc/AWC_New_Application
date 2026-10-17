import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  articles: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.string(),
      category: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      authorTitle: z.string().optional(),
      readingTime: z.string(),
      featured: z.boolean().default(false),
      publicationStatus: z.enum(['APPROVED', 'NEEDS_PROFESSIONAL_REVIEW', 'NEEDS_FACT_CHECK', 'DRAFT']),
      reviewNotes: z.string().optional(),
      calculatorCTA: z.object({
        title: z.string(),
        description: z.string(),
        buttonLabel: z.string(),
        href: z.string(),
      }).optional(),
    }),
  }),
};
