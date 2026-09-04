import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { resolve } from 'path';

const articlesDir = resolve(process.cwd(), 'content/articles');
const conceptsDir = resolve(process.cwd(), 'content/concepts');

// Keep created/updated as the ORIGINAL frontmatter string, not a parsed Date —
// parsing + toISOString() can shift an evening-local timestamp to the next
// calendar day in UTC, which breaks date-based sorting/grouping.
const timeField = z
  .union([z.date(), z.string()])
  .transform((v) => (v instanceof Date ? v.toISOString() : String(v)));

const stringArray = z.any().transform((v) => (Array.isArray(v) ? v.map(String) : []));

// Controlled vocabulary for study_type — see data/controlled_vocabularies/study_type.yml.
// Duplicated here as a build-time gate so "RCT" / "randomised trial" / "randomized controlled
// study" cannot silently become separate categories (brief, Section 12).
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

// Kucirkova et al. 2025 (Humanities & Social Sciences Communications,
// https://doi.org/10.1057/s41599-025-05330-9) defines five dimensions:
// efficacy, effectiveness, ethics, equity, environment. "viability" is kept
// here because the project brief lists it, but it is UNVERIFIED against that
// source — see data/taxonomy.yml for the discrepancy note.
const EVIDENCE_CATEGORIES = [
  'efficacy',
  'effectiveness',
  'ethics',
  'equity',
  'environment',
  'viability', // unverified — see data/taxonomy.yml
] as const;

// Per-dimension evidence tier, 1 (lowest) – 3 (highest weight of evidence),
// per Kucirkova et al. 2025 Table 3. A single article is usually assessed on
// ONE dimension at a time (e.g. an RCT is efficacy tier 3), so this is a
// single tier + the dimension it applies to, not one tier per dimension.
const evidenceTier = z.object({
  dimension: z.enum(EVIDENCE_CATEGORIES),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const sharedMeta = {
  countries: stringArray.optional(),
  education_levels: stringArray.optional(),
  age_groups: stringArray.optional(),
  technology_types: stringArray.optional(),
  tool_names: stringArray.optional(), // e.g. "duolingo", "khan-academy" — brief Section 24 Q1
  subjects: stringArray.optional(),
  outcomes: stringArray.optional(),
  evidence_categories: z
    .array(z.enum(EVIDENCE_CATEGORIES))
    .optional()
    .describe('5Es dimensions this page speaks to (Kucirkova et al. 2025)'),
  evidence_tier: evidenceTier
    .optional()
    .describe('Weight-of-evidence tier (1-3) for ONE dimension, per Kucirkova et al. 2025 Table 3 — omit if not assessed, never guess'),
};

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: articlesDir }),
  schema: z.object({
    title: z.string(),
    authors: stringArray,
    year: z.number().int().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().url().optional(),
    open_access: z.boolean().optional(),
    publication_type: z.string().optional(),
    study_type: z.enum(STUDY_TYPES).optional(),
    peer_reviewed: z.boolean().optional(),
    sample_size: z.number().int().optional(), // omit if not reported — never invent
    created: timeField,
    updated: timeField.optional().transform((v) => v ?? ''),
    tags: stringArray, // concept slugs
    sources: stringArray, // required provenance: raw/papers/<file> — never summarise from title alone
    confidence: z
      .string()
      .catch('medium')
      .transform((v) => (['high', 'medium', 'low'].includes(v) ? v : 'medium')),
    ...sharedMeta,
  }),
});

const concepts = defineCollection({
  loader: glob({ pattern: '*.md', base: conceptsDir }),
  schema: z.object({
    title: z.string(),
    created: timeField,
    updated: timeField.optional().transform((v) => v ?? ''),
    tags: stringArray,
    confidence: z
      .string()
      .catch('medium')
      .transform((v) => (['high', 'medium', 'low'].includes(v) ? v : 'medium')),
    ...sharedMeta,
  }),
});

export const collections = { articles, concepts };
