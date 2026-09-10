import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { readdirSync } from 'node:fs';

const articlesDir = 'content/articles';
const conceptsDir = 'content/concepts';

const CONCEPT_SLUGS = new Set(
  readdirSync(conceptsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.slice(0, -3)),
);

const timeField = z
  .union([z.date(), z.string()])
  .transform(v => (v instanceof Date ? v.toISOString() : String(v)));

const rawSourcePath = z
  .string()
  .refine(p => /^raw\/papers\/[a-zA-Z0-9._-]+\.md$/.test(p), {
    message: "sources entries must be 'raw/papers/<slug>.md' paths, not URLs",
  });

const enumList = (...opts: string[]) =>
  z.array(z.enum(opts as [string, ...string[]])).optional().default([]);

const studyTypes = enumList(
  'rct', 'quasi_experimental', 'longitudinal', 'survey', 'qualitative',
  'mixed_methods', 'systematic_review', 'meta_analysis',
  'design_based_research', 'case_study', 'correlational', 'not_reported',
);

const educationLevels = enumList(
  'early_childhood', 'primary', 'secondary', 'higher_ed', 'adult', 'teacher_training',
);

const technologyTypes = enumList(
  'learning_management_system', 'educational_app', 'adaptive_learning_system',
  'intelligent_tutoring_system', 'digital_reading', 'educational_game',
  'ar_vr', 'learning_analytics', 'robotics', 'mobile_learning',
  'ai_in_education', 'generative_ai', 'digital_assessment',
);

const outcomeTypes = enumList(
  'literacy', 'numeracy', 'subject_knowledge', 'achievement', 'engagement',
  'motivation', 'metacognition', 'self_regulation', 'collaboration',
  'creativity', 'wellbeing',
);

const fivesTier = z.enum(['L1', 'L2', 'L3']).optional();

// Shared across articles and concepts.
const sharedMeta = {
  countries: z.array(z.string()).default([]),
  education_levels: educationLevels,
  age_groups: z.array(z.string()).default([]),
  technology_types: technologyTypes,
  tool_names: z.array(z.string()).default([]),   // duolingo, kahoot
  subjects: z.array(z.string()).default([]),
  outcomes: outcomeTypes,
  regions: z.array(z.string()).default([]),
  fives: z.object({
    efficacy: fivesTier,
    effectiveness: fivesTier,
    ethics: fivesTier,
    equity: fivesTier,
    environment: fivesTier,
  }).optional(),
};


const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: articlesDir }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number().int(),
    date_published: z.string().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
    url: z.string(),
    open_access: z.boolean(),
    type: z.literal('article').default('article'),
    study_type: studyTypes,
    peer_reviewed: z.boolean().optional(),
    sample_size: z.union([z.number().int(), z.literal('not_reported')]).optional(),
    source_file: z.string().optional(),
    summary: z.string().optional(),

    created: timeField,
    updated: timeField.optional().transform(v => v ?? ''),

    tags: z
      .array(z.string())
      .refine(arr => arr.every(slug => CONCEPT_SLUGS.has(slug)), {
        message: 'tags must be real concept slugs',
      }),
    sources: z.array(rawSourcePath),
    confidence: z.enum(['high', 'medium', 'low']),
    source_url: z.string().optional(),

    ever_scores: z.object({
  method_soundness: z.number().min(0).max(5),
  result_strength: z.number().min(0).max(5),
  generalizability: z.number().min(0).max(5),
  ethics_transparency: z.number().min(0).max(5)
}).optional(),

    ...sharedMeta,
  }),
});

const concepts = defineCollection({
  loader: glob({ pattern: '*.md', base: conceptsDir }),
  schema: z.object({
    title: z.string(),
    created: timeField,
    updated: timeField.optional().transform(v => v ?? ''),
    tags: z
      .array(z.string())
      .refine(arr => arr.every(slug => CONCEPT_SLUGS.has(slug)), {
        message: 'tags must be real concept slugs',
      }),
    confidence: z.enum(['high', 'medium', 'low']),
    source_url: z.string().optional(),
    ...sharedMeta,
  }),
});

export const collections = { articles, concepts };