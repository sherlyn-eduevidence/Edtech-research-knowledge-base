# Phase 1 Note: Reverse-Engineering the Reference Site (edtechdev/aied)

This note was produced by cloning `github.com/edtechdev/aied` directly (rather than reading
the marketing/site copy) and inspecting the actual source: `README.md`, `SCHEMA.md`,
`site.config.json`, `src/content.config.ts`, `astro.config.mjs`, `.github/workflows/*`,
sample files in `articles/`, `concepts/`, `faqs/`, `public/llms.txt`, and
`tooling/scripts/generate-llms-files.py`. It is current as of the repo state on **2026-09-04**;
I am not certain the reference project won't change its structure after this date, so re-check
before relying on specifics late in the project.

## 1. Technical stack

- **Astro 7** (static output, `output: 'static'`), deployed to **GitHub Pages** under a base
  path (`/aied`), via **GitHub Actions**.
- **astro-pagefind** for full-text client-side search (no backend/server).
- **@astrojs/sitemap** for sitemap.xml, **@astrojs/rss** for an RSS feed of new articles.
- **vite-plugin-pwa** + a custom `generate-sw.mjs` post-build step — the site is an installable
  PWA (manifest + service worker), which is more than the brief strictly asks for.
- **KaTeX** for math rendering, **nanostores** for small bits of client-side UI state
  (e.g. persisted search/theme prefs).
- Python tooling (not part of the Astro build) for: RSS/arXiv ingestion, `llms.txt` /
  `llms-full.txt` generation, and EPUB/PDF export (`pandoc` + `weasyprint`).
- No database. No server. Content is flat Markdown + YAML frontmatter, read at build time via
  Astro's content collections (`glob()` loader).

## 2. Repository organization

```
articles/            one .md file per paper (flat directory, ~1,000+ files)
concepts/             one .md file per synthesized topic (~180 files)
faqs/                 curated Q&A pages, cross-linked to concepts/articles
raw/papers/           raw source text pulled during ingestion — gitignored, NOT committed
src/
  config/              siteConfig.ts — typed wrapper around site.config.json
  content.config.ts     Zod schema for the three content collections
  layouts/             BaseLayout.astro (nav, search box, footer)
  lib/                 jsonld.ts (schema.org helpers)
  components/          JsonLd.astro, SourceButtons.astro
  pages/               index, journal, search, faq, ai (the "use with AI" page), rss.xml,
                       dynamic [slug] routes for articles/concepts
public/
  llms.txt             short catalog: every page as one bullet with a 1–2 sentence description
  llms-full.txt         full text of every page, concatenated
  aied.epub / aied.pdf  offline exports, generated from the same markdown
site.config.json        single source of truth for name/URL/base-path/license/theme — read by
                        Astro AND by the Python tooling, so nothing is hardcoded twice
tooling/                reusable scripts + a long SKILL.md documenting the ingestion "skill"
                        used by their AI agent
.github/workflows/      astro-build.yml (PR checks) + astro-deploy.yml (deploy on push to main)
```

**Key design choice worth copying directly:** `site.config.json` as the single source of truth
for all site metadata (name, URL, base path, license, editor contact, theme colors), imported by
both the Astro frontend and the Python tooling. This avoids the classic problem of the site name
being hardcoded in five different places.

## 3. Content architecture

Three flat content types, each a Markdown file with YAML frontmatter, validated by a Zod schema
in `src/content.config.ts` (Astro's `defineCollection` + `glob()` loader — no CMS, no database):

- **`articles/`** — one paper per page. Frontmatter: `title`, `created`/`updated`
  (full ISO timestamps, not just dates — used for chronological sorting), `tags` (concept
  slugs), `sources` (path to the raw source file — **required**, this is their provenance
  mechanism), `confidence` (`high`/`medium`/`low`), plus optional structured facets
  (`research_method`, `discipline`, `audience`, `level`, `category`). Body: a synthesis
  blockquote → Key Findings → Connected Concepts → Connected Articles → one APA citation line.
- **`concepts/`** — synthesized topic pages that pull together many articles. Same frontmatter
  shape minus `sources`. Body: synthesis blockquote → **Questions to Consider** (pre-reading
  questions, a nice touch) → Introduction (prose with dense inline `[[wikilinks]]`) →
  Connected Concepts → Connected Articles.
- **`faqs/`** — curated question pages, cross-linked via a `connected_faqs` frontmatter field
  that concepts/articles can point to.

**Cross-linking mechanism:** `[[wikilink]]` syntax inside the Markdown body (not just in the
"Connected X" lists), rendered as real links by the Astro templates. Their `SCHEMA.md` treats
this as a hard, enforced rule: every concept mentioned by name in body text must be
wiki-linked, checked by a dedicated internal "skill"/lint pass before each commit. This is the
mechanism that actually produces the "knowledge graph" feel — the Connected Concepts/Articles
lists alone would just be a directory, not a graph.

**Tags double as the concept vocabulary** — an article's `tags:` values are concept slugs, so
tagging an article automatically wires it into the graph; there is no separate free-text tag
namespace to reconcile.

## 4. Metadata / schema enforcement

Astro's Zod schema is the actual validation layer (build fails on bad frontmatter), not a
separate linter. Notably:
- `confidence` invalid values are coerced to `medium` via `.catch()` rather than failing the
  build — a soft-fail default, not a hard validation gate.
- Timestamps are deliberately **kept as strings**, not parsed into `Date` objects, specifically
  to avoid timezone-shift bugs when sorting — a subtlety I'd flag as worth copying, since it's
  the kind of bug that's easy to introduce and hard to notice.
- `research_method`, `discipline`, `audience`, `level`, `category` are present in the schema as
  optional structured facets but (per the README) "inert until surfaced in the UI" — i.e. they
  built the field before building the filter, which suggests searching/filtering by these facets
  hasn't shipped yet on the reference site, only tagging has.

I did not find a controlled-vocabulary enforcement file (e.g. a fixed list of allowed
`research_method` values) — I looked but could not confirm one exists in the current repo. **I
might be wrong here**, since I didn't exhaustively read every file in `tooling/`; worth a
second look if a QC script matters to you before Phase 2.

## 5. Search

Client-side, via **Pagefind** (`astro-pagefind`), which indexes the built static HTML at build
time and ships a small WASM-backed search index — no server, no API cost, works on GitHub Pages.
Indexes titles, body text, and (per the README) is the mechanism behind title/author/summary/tag
search from the brief's section 15. This is a strong, low-complexity choice for your "keep
dependencies simple" constraint in section 4 of the brief.

## 6. Deployment

Two GitHub Actions workflows:
- `astro-build.yml` — runs on PRs and pushes to `main`: `npm ci && npm run build`, then asserts
  key output files exist (`dist/index.html`, pagefind index, PWA manifest/service worker). This
  is effectively their QC gate for build correctness (not content correctness).
- `astro-deploy.yml` — on push to `main`: build, then `actions/upload-pages-artifact` +
  `actions/deploy-pages` (the standard, current GitHub Pages Actions flow — no `gh-pages` branch
  trick, no third-party deploy action).

`npm run build` itself is `astro check && astro build && node generate-sw.mjs` — type-checking
is part of the build, which will catch frontmatter/schema mismatches early.

## 7. llms.txt / llms-full.txt (AI-readability)

Generated by a **Python script** (`tooling/scripts/generate-llms-files.py`), run manually/locally
after content changes (not part of the Astro build) and committed as static files served from
`public/`. `llms.txt` is a compact catalog: one line per page (concept/article/FAQ) — link + a
short description extracted from the page's first real paragraph. `llms-full.txt` is the full
text of every page concatenated. The README's own worked example — pasting a fetch-`llms.txt`-
then-cite-sources prompt into an assistant — is essentially the same "point ChatGPT/Claude/
NotebookLM at it" use case your brief describes in section 16, so this part of their design can
likely be adapted with only moderate changes (renaming, and adding your evidence-quality/5Es
metadata to the descriptions).

## 8. Strengths worth adopting directly

1. `site.config.json` as single source of truth (Section 2 above).
2. Enforced inline wikilinking, not just "Connected" lists — this is what makes it a graph.
3. Timestamp-as-string handling to avoid timezone sort bugs.
4. `sources:` field required on every article — direct precedent for your brief's "preserve DOI
   and source metadata" / "AI should summarise provided source material" safeguards (Section 11
   of your brief) — worth copying almost verbatim, since the reference project has already hit
   and solved this exact problem.
5. Build-time schema validation via Zod, rather than a separate post-hoc QC pass, for structural
   correctness (though it doesn't validate content-quality claims — see gaps below).
6. Static-only architecture (no DB, no backend) — matches your brief's "keep dependencies simple"
   requirement in Section 4 and scales fine to the 500-paper Phase 4 target.

## 9. Gaps / things to improve rather than copy

- **No visible evidence-quality or country/region metadata fields.** Your brief's Sections 13–14
  (EVER/5Es evidence strength, Global North/South or World Bank income-group filtering) have no
  equivalent here — `research_method`/`discipline`/`level`/`category` exist but nothing tracks
  study countries, sample size, or evidence-strength category. This is a genuine gap to design
  fresh, not adapt.
- **No specific-tool tagging** (e.g. "Duolingo", "Khan Academy") that I could find — needed for
  your brief's Section 24 Q1 ("which edtech tools have the most studies"). Would need a new
  `tools:` (or similar) frontmatter facet plus a controlled vocabulary of tool names.
- **No visible automated QC script catalog** matching your Section 22 list (duplicate DOI,
  broken URLs, dangling concept links, invalid YAML, missing citations) — `astro-build.yml`
  checks *build* health, not *content* health. You'll likely need to write these QC scripts
  from scratch rather than adapt existing ones — I did not find them in `tooling/scripts/`
  (only `add-backlinks.py`, `detect-readfile-corruption.py`, `fetch-rss-feeds.py`,
  `generate-llms-files.py`, and others I did not fully enumerate — **you should verify** the
  full script list yourself before assuming QC coverage either way).
- **Structured facets are "inert" (not yet surfaced in UI/search filters)** per their own README
  — if faceted filtering (by method, level, country) matters for your Section 15 navigation
  requirements, that UI work has no reference implementation to copy; it would be new Astro
  component work.
- **Domain is narrower than yours by design** (AI-in-Education specifically vs. EdTech broadly),
  so the taxonomy (`concepts/`) reflects an AIED-specific ontology (scaffolding, agentic AI,
  cognitive offloading, etc.) that doesn't map onto your 5Es/EdTech-type framework — the concept
  *pages* are a pattern to copy, the concept *taxonomy contents* are not.
- **Content volume:** the reference site already has 1,072 articles and 183 concepts — far past
  your Phase 2 target of 20–30/10–15. Useful as a north star for where the architecture needs to
  hold up, but not a template to imitate at Phase 1/2 scale.

## 10. Elements to adapt (not copy verbatim) for `edtech-research`

| Reference element | Adaptation needed |
|---|---|
| `concepts/` taxonomy contents | Replace with your 5Es (Efficacy/Effectiveness/Ethics/Equity/Environment/Viability) + EdTech-type taxonomy once Prof. Kucirkova shares the 5Es documents |
| Frontmatter schema | Add `countries`, `education_levels`, `sample_size`, `peer_reviewed`, `study_type` (controlled vocabulary), `tool_names` — per your brief's Section 12 |
| `site.config.json` | Same pattern, new values (`edtech-research` name/repo/description) |
| `tooling/scripts/generate-llms-files.py` | Reusable almost as-is; extend the per-page description to surface evidence-quality metadata |
| QC scripts | Build new — no reference implementation exists for your Section 22 checklist |
| Search terms / inclusion criteria file | No equivalent exists in the reference repo (their ingestion criteria live in prose in `tooling/SKILL.md`, not a structured, reproducible file) — your brief's Section 9 requirement (a `data/search_terms.yml`) is a genuine improvement over the reference site, not an adaptation of anything they have |

---
*This note is descriptive of the reference repository's code as of the date above. I have not
verified claims against the live deployed site's runtime behavior (e.g. exact search UX) —
only against the source; if anything here matters for a decision, a quick look at the live site
at https://edtechdev.github.io/aied is worth doing before you rely on it.*
