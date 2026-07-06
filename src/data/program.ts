// RISE PA — the single shared DATA object (PRD §6).
// Imported by BOTH iterations so the before/after shows design change, not data change.
// Numbers are the realistic mid-program figures from the PRD — never empty placeholders.

import type {
  Annotation,
  DeploymentPoint,
  Deltas,
  ForecastPoint,
  IndustryDatum,
  ProgramTotals,
  TrimesterWindow,
} from './types'

/* ── §6.1 Program-level totals (statewide, "All trimesters") ─────────────── */
export const PROGRAM: ProgramTotals = {
  pool: 40_000_000,
  obligated: 24_500_000, // committed — 61% of pool
  disbursed: 11_800_000, // realized / paid — 30% of pool (~48% of obligated)
  remaining: 15_500_000, // unobligated
  projectsFunded: 124,
  applications: 178,
  ghgCommitted: 138_000, // tCO2e/yr projected at award
  ghgRealized: 41_000, // tCO2e/yr verified at completion (~30% — early-program lag)
  jobsCommitted: 418,
  jobsRealized: 132,
  deadline: '2028-04-30',
  avgAward: 197_000,
  costPerTon: 178, // $/tCO2e (committed basis)
  countiesReached: 59,
  countiesTotal: 67,
  regionsCovered: 6,
  regionsTotal: 6,
  lidacShare: 0.41, // disadvantaged-community coverage (optional, Justice40)
  // ── Iteration 2 only ──
  forecastObligatedByDeadline: 37_500_000, // projected at current pace
  atRiskOfReturn: 2_500_000, // ~6% — funds at risk of returning to EPA
  paceStatus: 'watch',
}

/** Deltas vs previous trimester (Iteration 2 KPI badges) — illustrative (§6.1). */
export const DELTAS: Deltas = {
  obligated: 3_200_000,
  disbursed: 1_900_000,
  projectsFunded: 18,
  ghgRealized: 9_000,
  jobsRealized: 31,
}

/* ── §6.2 Trimester windows (10 total) ───────────────────────────────────── */
export const WINDOWS: TrimesterWindow[] = [
  {
    id: 'T1.1',
    label: 'T1.1',
    period: 'Jan–Apr 2025',
    year: 1,
    status: 'complete',
    applications: 28,
    awarded: 24,
    obligated: 4_100_000,
    funnel: { received: 28, screened: 26, underReview: 0, awarded: 24, deniedWithdrawn: 4 },
  },
  {
    id: 'T1.2',
    label: 'T1.2',
    period: 'May–Aug 2025',
    year: 1,
    status: 'complete',
    applications: 41,
    awarded: 35,
    obligated: 6_600_000,
    funnel: { received: 41, screened: 38, underReview: 0, awarded: 35, deniedWithdrawn: 6 },
  },
  {
    id: 'T1.3',
    label: 'T1.3',
    period: 'Sep–Dec 2025',
    year: 1,
    status: 'complete',
    applications: 19,
    awarded: 16,
    obligated: 2_900_000,
    funnel: { received: 19, screened: 18, underReview: 0, awarded: 16, deniedWithdrawn: 3 },
  },
  {
    id: 'T2.1',
    label: 'T2.1',
    period: 'Jan–Apr 2026',
    year: 2,
    status: 'complete',
    applications: 52,
    awarded: 44,
    obligated: 8_300_000,
    funnel: { received: 52, screened: 47, underReview: 0, awarded: 44, deniedWithdrawn: 8 },
  },
  {
    id: 'T2.2',
    label: 'T2.2',
    period: 'May–Aug 2026',
    year: 2,
    status: 'active',
    conditional: true,
    applications: 38,
    awarded: 5, // conditional
    obligated: 2_600_000, // conditional
    funnel: { received: 38, screened: 33, underReview: 21, awarded: 5, deniedWithdrawn: 7 },
  },
  { id: 'T2.3', label: 'T2.3', period: 'Sep–Dec 2026', year: 2, status: 'upcoming', applications: null, awarded: null, obligated: null },
  { id: 'T3.1', label: 'T3.1', period: 'Jan–Apr 2027', year: 3, status: 'upcoming', applications: null, awarded: null, obligated: null },
  { id: 'T3.2', label: 'T3.2', period: 'May–Aug 2027', year: 3, status: 'upcoming', applications: null, awarded: null, obligated: null },
  { id: 'T3.3', label: 'T3.3', period: 'Sep–Dec 2027', year: 3, status: 'upcoming', applications: null, awarded: null, obligated: null },
  { id: 'T4.1', label: 'T4.1', period: 'Jan–Apr 2028', year: 4, status: 'upcoming', applications: null, awarded: null, obligated: null },
]

/** Grant years for the filter (§6.2). */
// Window ids read as T{year}.{trimester}; each grant year aligns to a calendar
// year (T1.* → 2025, T2.* → 2026, …), so we label the filter by year.
export const GRANT_YEARS: { year: 1 | 2 | 3 | 4; label: string; windowIds: string[] }[] = [
  { year: 1, label: '2025', windowIds: ['T1.1', 'T1.2', 'T1.3'] },
  { year: 2, label: '2026', windowIds: ['T2.1', 'T2.2', 'T2.3'] },
  { year: 3, label: '2027', windowIds: ['T3.1', 'T3.2', 'T3.3'] },
  { year: 4, label: '2028', windowIds: ['T4.1'] },
]

/* ── §6.3 Cumulative deployment time-series (runway chart) ───────────────── */
// $M cumulative by window close. Disbursement lags obligation (reimbursement
// reality). Within any single window, disbursed ≤ obligated (obligation is the
// reviewed reimbursement ceiling; disbursed is what has actually been paid out).
// Older windows are more fully reimbursed; recent windows barely started — so the
// per-window increments decline with recency and never exceed that window's
// obligation. Increments: 3.0, 4.4, 1.7, 2.3, 0.4 vs obligated 4.1, 6.6, 2.9, 8.3, 2.6.
export const DEPLOYMENT: DeploymentPoint[] = [
  { windowId: 'T1.1', label: 'T1.1', obligated: 4.1, disbursed: 3.0 },
  { windowId: 'T1.2', label: 'T1.2', obligated: 10.7, disbursed: 7.4 },
  { windowId: 'T1.3', label: 'T1.3', obligated: 13.6, disbursed: 9.1 },
  { windowId: 'T2.1', label: 'T2.1', obligated: 21.9, disbursed: 11.4 },
  { windowId: 'T2.2', label: 'T2.2', obligated: 24.5, disbursed: 11.8 },
]

// Iteration 2 forecast continuation (dashed) from the current point to the
// April 2028 deadline, ending near forecastObligatedByDeadline (37.5),
// with a best/expected/worst band (§6.3).
export const FORECAST: ForecastPoint[] = [
  { label: 'T2.2', expected: 24.5, best: 24.5, worst: 24.5 }, // anchor = current actual
  { label: 'T2.3', expected: 27.4, best: 27.9, worst: 26.6 },
  { label: 'T3.1', expected: 30.1, best: 31.2, worst: 28.7 },
  { label: 'T3.2', expected: 32.6, best: 34.2, worst: 30.5 },
  { label: 'T3.3', expected: 34.9, best: 37.0, worst: 32.1 },
  { label: 'T4.1', expected: 36.6, best: 39.4, worst: 33.4 },
  { label: 'Apr 2028', expected: 37.5, best: 40.0, worst: 34.0 },
]

export const POOL_M = 40 // $40M ceiling line on the runway

/* ── §6.5 Industry composition (statewide) — ranked numbers, NO treemap ───── */
export const INDUSTRIES_STATEWIDE: IndustryDatum[] = [
  { name: 'Fabricated Metal Products', funding: 5_200_000, projects: 27 },
  { name: 'Food Manufacturing', funding: 4_100_000, projects: 22 },
  { name: 'Plastics & Rubber Products', funding: 3_300_000, projects: 18 },
  { name: 'Machinery Manufacturing', funding: 2_900_000, projects: 15 },
  { name: 'Chemical Manufacturing', funding: 2_400_000, projects: 12 },
  { name: 'Wood & Paper Products', funding: 1_800_000, projects: 11 },
  { name: 'Other', funding: 4_800_000, projects: 19 },
]

/* ── Timeline / pipeline context annotations (Iteration 2, PRD §12.5) ─────── */
export const ANNOTATIONS: Annotation[] = [
  {
    windowId: 'T1.3',
    title: 'Holiday-window dip',
    detail:
      'The Sep–Dec window closes mid-December over the holidays — applications dip seasonally, not from weak demand.',
  },
  {
    windowId: 'T2.1',
    title: 'Outreach push',
    detail: 'A Q1 manufacturer outreach campaign drove the program’s strongest application window.',
  },
  {
    windowId: 'T2.2',
    title: 'Reviews in flight',
    detail: '21 applications still under review; awards shown are conditional pending final scoring.',
  },
]

/* ── "Since last review" digest (Iteration 2, PRD §12.4) ─────────────────── */
export const SINCE_LAST_REVIEW = {
  sinceLabel: 'Since last review · T2.1 close',
  items: [
    { label: 'obligated', value: '+$3.2M' },
    { label: 'projects funded', value: '+18' },
    { label: 'GHG realized', value: '+9.0k tCO₂e' },
    { label: 'jobs realized', value: '+31' },
  ],
}
