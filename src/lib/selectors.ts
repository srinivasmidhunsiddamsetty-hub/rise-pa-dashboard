// Pure filter-scope + area-aggregation logic (PRD §14 — keep components declarative).
// Everything the global filter and the map recompute flows through these functions.

import {
  DELTAS,
  DEPLOYMENT,
  GRANT_YEARS,
  INDUSTRIES_STATEWIDE,
  PROGRAM,
  WINDOWS,
} from '../data/program'
import {
  COUNTY_DATA,
  countyNameByFips,
  countyRegion,
  INDUSTRIES_BY_REGION,
  REGIONS,
  REGION_COUNTIES,
} from '../data/regions'
import type {
  CountyDatum,
  IndustryDatum,
  RegionName,
  ScopedMetrics,
} from '../data/types'

/* ── Global time filter ──────────────────────────────────────────────────── */
export type FilterScope =
  | { mode: 'all' }
  | { mode: 'trimester'; windowId: string }
  | { mode: 'year'; year: 1 | 2 | 3 | 4 }

// Program-wide realization ratios, derived once from the canonical totals.
// Used to split committed → realized for any sub-scope or area, honestly and
// consistently (early-program lag shows everywhere, not just the headline).
export const DISBURSED_RATIO = PROGRAM.disbursed / PROGRAM.obligated // ~0.482
const GHG_REALIZED_RATIO = PROGRAM.ghgRealized / PROGRAM.ghgCommitted // ~0.297
const JOBS_REALIZED_RATIO = PROGRAM.jobsRealized / PROGRAM.jobsCommitted // ~0.316
const GHG_PER_DOLLAR = PROGRAM.ghgCommitted / PROGRAM.obligated
const JOBS_PER_DOLLAR = PROGRAM.jobsCommitted / PROGRAM.obligated

/** Disbursement increment per window, derived from the cumulative series. */
function disbursedIncrements(): Record<string, number> {
  const out: Record<string, number> = {}
  let prev = 0
  for (const p of DEPLOYMENT) {
    out[p.windowId] = (p.disbursed - prev) * 1_000_000
    prev = p.disbursed
  }
  return out
}
const DISBURSED_BY_WINDOW = disbursedIncrements()

/** Which windows fall inside a scope. */
export function scopeWindowIds(scope: FilterScope): string[] {
  if (scope.mode === 'all') return WINDOWS.filter((w) => w.status !== 'upcoming').map((w) => w.id)
  if (scope.mode === 'trimester') return [scope.windowId]
  return GRANT_YEARS.find((y) => y.year === scope.year)?.windowIds ?? []
}

/** A human-readable label for the active scope (always-visible breadcrumb). */
export function scopeLabel(scope: FilterScope): string {
  if (scope.mode === 'all') return 'All trimesters · program to date'
  if (scope.mode === 'trimester') {
    const w = WINDOWS.find((x) => x.id === scope.windowId)
    return w ? `${w.id} · ${w.period}` : scope.windowId
  }
  const y = GRANT_YEARS.find((x) => x.year === scope.year)
  return y ? `${y.label} · ${y.windowIds.join(' + ')}` : `Year ${scope.year}`
}

/** Per-window derived metrics (committed via obligation share, realized via disbursement share). */
function windowMetrics(windowId: string) {
  const w = WINDOWS.find((x) => x.id === windowId)
  if (!w || w.obligated == null) {
    return {
      obligated: 0, disbursed: 0, projectsFunded: 0, applications: 0,
      ghgCommitted: 0, ghgRealized: 0, jobsCommitted: 0, jobsRealized: 0,
    }
  }
  const obligated = w.obligated
  const disbursed = DISBURSED_BY_WINDOW[windowId] ?? 0
  return {
    obligated,
    disbursed,
    projectsFunded: w.awarded ?? 0,
    applications: w.applications ?? 0,
    ghgCommitted: Math.round(obligated * GHG_PER_DOLLAR),
    ghgRealized: Math.round(disbursed * (PROGRAM.ghgRealized / PROGRAM.disbursed)),
    jobsCommitted: Math.round(obligated * JOBS_PER_DOLLAR),
    jobsRealized: Math.round(disbursed * (PROGRAM.jobsRealized / PROGRAM.disbursed)),
  }
}

/** The headline metrics for the current scope (drives Vital Signs). */
export function computeMetrics(scope: FilterScope): ScopedMetrics {
  if (scope.mode === 'all') {
    // Canonical program totals — never re-derived, so the headline is authoritative.
    return {
      scopeLabel: scopeLabel(scope),
      obligated: PROGRAM.obligated,
      disbursed: PROGRAM.disbursed,
      projectsFunded: PROGRAM.projectsFunded,
      applications: PROGRAM.applications,
      ghgCommitted: PROGRAM.ghgCommitted,
      ghgRealized: PROGRAM.ghgRealized,
      jobsCommitted: PROGRAM.jobsCommitted,
      jobsRealized: PROGRAM.jobsRealized,
      poolShareObligated: PROGRAM.obligated / PROGRAM.pool,
      poolShareDisbursed: PROGRAM.disbursed / PROGRAM.pool,
      deltas: DELTAS, // "since last closed trimester"
    }
  }

  const ids = scopeWindowIds(scope)
  const agg = ids
    .map(windowMetrics)
    .reduce((a, m) => ({
      obligated: a.obligated + m.obligated,
      disbursed: a.disbursed + m.disbursed,
      projectsFunded: a.projectsFunded + m.projectsFunded,
      applications: a.applications + m.applications,
      ghgCommitted: a.ghgCommitted + m.ghgCommitted,
      ghgRealized: a.ghgRealized + m.ghgRealized,
      jobsCommitted: a.jobsCommitted + m.jobsCommitted,
      jobsRealized: a.jobsRealized + m.jobsRealized,
    }), {
      obligated: 0, disbursed: 0, projectsFunded: 0, applications: 0,
      ghgCommitted: 0, ghgRealized: 0, jobsCommitted: 0, jobsRealized: 0,
    })

  return {
    scopeLabel: scopeLabel(scope),
    ...agg,
    poolShareObligated: agg.obligated / PROGRAM.pool,
    poolShareDisbursed: agg.disbursed / PROGRAM.pool,
    deltas: null, // deltas are a program-level "since last trimester" signal only
  }
}

/* ── Trimester pipeline ──────────────────────────────────────────────────── */
export type PipelineMode = 'overview' | 'funnel'
export function pipelineMode(scope: FilterScope): PipelineMode {
  return scope.mode === 'all' ? 'overview' : 'funnel'
}

export interface FunnelStage {
  key: string
  label: string
  value: number
  kind: 'flow' | 'dropoff'
}

/** Aggregate the funnel stages across the scoped windows (single window or a year). */
export function aggregateFunnel(scope: FilterScope): { stages: FunnelStage[]; windowIds: string[] } {
  const ids = scopeWindowIds(scope)
  const totals = { received: 0, screened: 0, underReview: 0, awarded: 0, deniedWithdrawn: 0 }
  for (const id of ids) {
    const w = WINDOWS.find((x) => x.id === id)
    if (w?.funnel) {
      totals.received += w.funnel.received
      totals.screened += w.funnel.screened
      totals.underReview += w.funnel.underReview
      totals.awarded += w.funnel.awarded
      totals.deniedWithdrawn += w.funnel.deniedWithdrawn
    }
  }
  const stages: FunnelStage[] = [
    { key: 'received', label: 'Received', value: totals.received, kind: 'flow' },
    { key: 'screened', label: 'Eligible / screened', value: totals.screened, kind: 'flow' },
    { key: 'underReview', label: 'Under review', value: totals.underReview, kind: 'flow' },
    { key: 'awarded', label: 'Funded', value: totals.awarded, kind: 'flow' },
    { key: 'deniedWithdrawn', label: 'Denied / withdrawn', value: totals.deniedWithdrawn, kind: 'dropoff' },
  ]
  return { stages, windowIds: ids }
}

/* ── Tab 2 — area aggregation ────────────────────────────────────────────── */
export type AreaLevel = 'county' | 'region'
export type AreaSelection =
  | { level: 'region'; name: RegionName }
  | { level: 'county'; fips: string }
  | null

export interface AreaInsight {
  type: 'statewide' | 'region' | 'county'
  name: string
  empty?: boolean // county selected but no awards yet
  regionName?: RegionName
  funding: number // obligated / committed
  disbursed: number // actually paid out
  fundingShare: number // share of statewide funding
  projects: number
  ghgCommitted: number
  ghgRealized: number
  jobsCommitted: number
  jobsRealized: number
  lidacShare?: number
  industries: IndustryDatum[]
  // statewide-only extras:
  countiesReached?: number
  countiesTotal?: number
  regionsCovered?: number
  regionsTotal?: number
  topRegions?: { region: RegionName; funding: number }[]
}

function realizedFor(funding: number, ghgCommitted: number) {
  const jobsCommitted = Math.round(funding * JOBS_PER_DOLLAR)
  return {
    ghgRealized: Math.round(ghgCommitted * GHG_REALIZED_RATIO),
    jobsCommitted,
    jobsRealized: Math.round(jobsCommitted * JOBS_REALIZED_RATIO),
  }
}

/**
 * Proportional time-scope factor (PRD §7.1 — the filter recomputes Tab 2 too).
 * There is no per-trimester geographic data, so we scale the program-to-date
 * geography by the scope's share of total obligation. mode 'all' → 1.0.
 */
export function scopeFactor(scope: FilterScope): number {
  if (scope.mode === 'all') return 1
  return computeMetrics(scope).obligated / PROGRAM.obligated
}

export function statewideInsight(factor = 1): AreaInsight {
  return {
    type: 'statewide',
    name: 'Statewide',
    funding: Math.round(PROGRAM.obligated * factor),
    disbursed: Math.round(PROGRAM.disbursed * factor),
    fundingShare: 1,
    projects: Math.round(PROGRAM.projectsFunded * factor),
    ghgCommitted: Math.round(PROGRAM.ghgCommitted * factor),
    ghgRealized: Math.round(PROGRAM.ghgRealized * factor),
    jobsCommitted: Math.round(PROGRAM.jobsCommitted * factor),
    jobsRealized: Math.round(PROGRAM.jobsRealized * factor),
    lidacShare: PROGRAM.lidacShare,
    industries: INDUSTRIES_STATEWIDE,
    countiesReached: PROGRAM.countiesReached,
    countiesTotal: PROGRAM.countiesTotal,
    regionsCovered: PROGRAM.regionsCovered,
    regionsTotal: PROGRAM.regionsTotal,
    topRegions: [...REGIONS]
      .sort((a, b) => b.funding - a.funding)
      .map((r) => ({ region: r.region, funding: Math.round(r.funding * factor) })),
  }
}

export function areaInsight(sel: AreaSelection, factor = 1): AreaInsight {
  if (!sel) return statewideInsight(factor)

  if (sel.level === 'region') {
    const r = REGIONS.find((x) => x.region === sel.name)!
    const rel = realizedFor(r.funding, r.ghgCommitted)
    return {
      type: 'region',
      name: `${r.region} region`,
      funding: Math.round(r.funding * factor),
      disbursed: Math.round(r.funding * factor * DISBURSED_RATIO),
      fundingShare: r.funding / PROGRAM.obligated,
      projects: Math.round(r.projects * factor),
      ghgCommitted: Math.round(r.ghgCommitted * factor),
      ghgRealized: Math.round(rel.ghgRealized * factor),
      jobsCommitted: Math.round(rel.jobsCommitted * factor),
      jobsRealized: Math.round(rel.jobsRealized * factor),
      lidacShare: r.lidacShare,
      industries: INDUSTRIES_BY_REGION[r.region],
    }
  }

  // county
  const c = countyDataByFips(sel.fips)
  if (!c) {
    // County with no awards yet — still name/locate it and flag it empty so the
    // panel can render an explicit "no projects funded yet" state.
    const name = countyNameByFips(sel.fips)
    return {
      type: 'county',
      name: name ? `${name} County` : 'County',
      regionName: name ? countyRegion(name) : undefined,
      empty: true,
      funding: 0, disbursed: 0, fundingShare: 0, projects: 0,
      ghgCommitted: 0, ghgRealized: 0, jobsCommitted: 0, jobsRealized: 0, industries: [],
    }
  }
  const rel = realizedFor(c.funding, c.ghg)
  return {
    type: 'county',
    name: `${c.name} County`,
    funding: Math.round(c.funding * factor),
    disbursed: Math.round(c.funding * factor * DISBURSED_RATIO),
    fundingShare: c.funding / PROGRAM.obligated,
    projects: Math.round(c.projects * factor),
    ghgCommitted: Math.round(c.ghg * factor),
    ghgRealized: Math.round(rel.ghgRealized * factor),
    jobsCommitted: Math.round(rel.jobsCommitted * factor),
    jobsRealized: Math.round(rel.jobsRealized * factor),
    industries: INDUSTRIES_BY_REGION[c.region].slice(0, 4),
  }
}

function countyDataByFips(fips: string): CountyDatum | undefined {
  for (const name of Object.keys(COUNTY_DATA)) {
    if (COUNTY_DATA[name].fips === fips) return COUNTY_DATA[name]
  }
  return undefined
}

/** Region aggregate funding by FIPS (for the region-view choropleth). */
export function regionFundingByName(name: RegionName): number {
  return REGIONS.find((r) => r.region === name)?.funding ?? 0
}

export { REGION_COUNTIES }
