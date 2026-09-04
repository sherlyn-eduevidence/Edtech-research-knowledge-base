import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const timeField = z
  .union([z.date(), z.string()])
  .transform((v: any) => (v instanceof Date ? v.toISOString() : String(v)));

const stringArray = z.any().transform((v: any) => (Array.isArray(v) ? v.map(String) : []));

const STUDY_TYPES = [
  'rct',
  'quasi-experimental',
  'longitudinal',
  'survey',
  'qualitative',
  'mixed-methods',
  'systematic-review',
  'meta-analysis',
  'design-based-research',
  'case-study',
  'other',
] as const;

const EVIDENCE_CATEGORIES = [
  'efficacy',
  'effectiveness',
  'ethics',
  'equity',
  'environment',
  'viability',
] as const;

const evidenceTier = z.object({
  dimension: z.enum(EVIDENCE_CATEGORIES),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const sharedMeta = {
  countries: stringArray.optional(),
  education_levels: stringArray.optional(),
  age_groups: stringArray.optional(),
  technology_types: stringArray.optional(),
  tool_names: stringArray.optional(),
  subjects: stringArray.optional(),
  outcomes: stringArray.optional(),
  evidence_categories: z.array(z.enum(EVIDENCE_CATEGORIES)).optional(),
  evidence_tier: evidenceTier.optional(),
};

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    authors: stringArray,
    year: z.number().int().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    url: z.union([z.string().url(), z.literal('')]).optional(),
    open_access: z.boolean().optional(),
    publication_type: z.string().optional(),
    study_type: z.enum(STUDY_TYPES).optional(),
    peer_reviewed: z.boolean().optional(),
    sample_size: z.number().int().optional(),
    created: timeField,
    updated: timeField.optional().transform((v: any) => v ?? ''),
    tags: stringArray,
    sources: stringArray,
    confidence: z
      .string()
      .catch('medium')
      .transform((v: any) => (['high', 'medium', 'low'].includes(v) ? v : 'medium')),
    ...sharedMeta,
  }),
});

const concepts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/concepts' }),
  schema: z.object({
    title: z.string(),
    created: timeField,
    updated: timeField.optional().transform((v: any) => v ?? ''),
    tags: stringArray,
    confidence: z
      .string()
      .catch('medium')
      .transform((v: any) => (['high', 'medium', 'low'].includes(v) ? v : 'medium')),
    ...sharedMeta,
  }),
});

export const collections = { articles, concepts };