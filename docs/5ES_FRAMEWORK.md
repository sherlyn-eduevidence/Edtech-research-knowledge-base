# The 5Es Evidence Framework — reference note

**Source:** Kucirkova, N., Schewe, O., Campbell, J., Lindroos Cermakova, A., &
Pitchford, N. (2025). Developing evidence indicators for evaluating K12
EdTech: towards a consensus on educational impact. *Humanities and Social
Sciences Communications*, 12, 947. https://doi.org/10.1057/s41599-025-05330-9
— open access, CC BY 4.0.

This note paraphrases the paper's framework for use in this project; it is
not a substitute for reading the paper, and anything quoted below is kept
short and attributed. Numbers/wording in `data/taxonomy.yml` are derived from
this paper's Table 3 ("Final Set of Indicators").

## What the 5Es are

Five dimensions of EdTech impact evidence: **efficacy**, **effectiveness**,
**ethics**, **equity**, **environment**. Efficacy and effectiveness measure
demonstrated learning-outcome impact; ethics, equity, and environment map to
the UN's "universal values" framing under the SDGs. Each dimension is scored
on a **three-tier weight-of-evidence scale** (low/medium/high, i.e. tier
1/2/3), not a single pass/fail or composite score — the paper explicitly
argues against collapsing this into one overall "quality score."

- **Efficacy** — does the tool work under controlled/ideal conditions?
  Tier 3 = an experimental study with a control group and random assignment,
  by an independent researcher (i.e., what a controlled-vocabulary
  `study_type: rct` article would typically support).
- **Effectiveness** — does it work in real classroom use? Tier 3 = a
  replication study demonstrating cost-effectiveness and contextual fit.
- **Ethics** — data handling, interoperability, human oversight/accountability.
- **Equity** — inclusive design, bias awareness/mitigation, reach across
  diverse learner groups.
- **Environment** — the organisation's environmental practices and impact,
  not just the product's.

**Important — not in this source:** the project brief lists a sixth
category, "viability." I did not find "viability" anywhere in this 2025
paper (its own abstract and every table describe exactly five dimensions).
I've kept `viability` in the taxonomy/schema as an unverified placeholder
per the brief, but I'd flag this discrepancy to Prof. Kucirkova directly
rather than assume what it should mean — it may be from a different / newer
document than this paper.

## How this maps onto our schema

- `evidence_categories` (article/concept frontmatter) — which of the 5Es a
  page speaks to.
- `evidence_tier` — a single `{dimension, tier}` pair recording where ONE
  piece of evidence sits (e.g. an RCT → `{dimension: efficacy, tier: 3}`).
  Only set this when the paper's own design clearly supports a tier — per
  the AI-use safeguards in the project brief, do not infer a tier from a
  paper's abstract alone, and never call something an RCT unless random
  allocation is explicitly established.
- A single article will usually support tiering on only one or two
  dimensions (most papers are efficacy OR effectiveness studies, not both);
  don't force every dimension onto every article.

## Also referenced in the brief but not yet reviewed

**EVER (EdTech Evidence Evaluation Routine)** — Kucirkova, N., Brod, G., &
Gaab, N. (2023). Applying the science of learning to EdTech evidence
evaluations using the EdTech Evidence Evaluation Routine (EVER). *npj Science
of Learning*, 8(1), 35–37. This citation appears in the reference list of the
2025 paper above, but I have not read the EVER paper itself, so I can't yet
summarize what it adds beyond the 5Es framework — worth reading before
Phase 2 schema finalization if EVER specifies anything beyond what's
captured here.

## Open questions to raise with Prof. Kucirkova (Phase 2, per timeline)

1. Is "viability" part of a newer/different 5Es formulation than the 2025
   paper above, and if so, what's its definition and tiering?
2. Does EVER (2023) add fields or tiers we should capture that this 2025
   paper doesn't cover?
3. Should `evidence_tier` be applied per-article (as scaffolded here) or
   only at the concept-page synthesis level, once multiple articles are
   aggregated? The paper's own validation examples (e.g. the Edmentum/
   LearnPlatform case study) tier a *submitted evidence report*, which may
   map more naturally to a concept-level or tool-level rollup than to a
   single research article.
