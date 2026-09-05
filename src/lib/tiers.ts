// Mirrors the tier language in data/taxonomy.yml (sourced from Kucirkova et
// al. 2025, Table 3). Kept as a small TS helper so pages don't each re-derive
// labels; if data/taxonomy.yml changes, update this to match.

export const DIMENSION_LABELS: Record<string, string> = {
  efficacy: 'Efficacy',
  effectiveness: 'Effectiveness',
  ethics: 'Ethics',
  equity: 'Equity',
  environment: 'Environment',
  viability: 'Viability (unverified)',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
};

export function tierLabel(dimension: string, tier: number): string {
  const dim = DIMENSION_LABELS[dimension] ?? dimension;
  return `${dim} · ${TIER_LABELS[tier] ?? `Tier ${tier}`}`;
}

export function tierClass(tier: number): string {
  return `tier tier-${tier >= 1 && tier <= 3 ? tier : 1}`;
}
