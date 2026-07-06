// RISE PA — shared data types (PRD §6)
// One dataset, one set of types, consumed by BOTH iterations.

export type WindowStatus = 'complete' | 'active' | 'upcoming'
export type PaceStatus = 'on_track' | 'watch' | 'behind'
export type RegionName =
  | 'Southwest'
  | 'Southeast'
  | 'Southcentral'
  | 'Northeast'
  | 'Northwest'
  | 'Northcentral'

/** A single trimester award window (10 total: T1.1 → T4.1; id = T{year}.{trimester}). */
export interface TrimesterWindow {
  id: string // e.g. "T2.2"
  label: string // e.g. "T2.2"
  period: string // e.g. "May–Aug 2026"
  year: 1 | 2 | 3 | 4
  status: WindowStatus
  conditional?: boolean
  applications: number | null
  awarded: number | null
  obligated: number | null // dollars
  // Application-stage breakdown for the single-window funnel (PRD §6.2)
  funnel?: {
    received: number
    screened: number
    underReview: number
    awarded: number
    deniedWithdrawn: number
  }
}

/** Cumulative deployment point for the runway chart (PRD §6.3). */
export interface DeploymentPoint {
  windowId: string
  label: string
  obligated: number // $M cumulative
  disbursed: number // $M cumulative
}

/** Forecast continuation point (Iteration 2 only). */
export interface ForecastPoint {
  label: string
  expected: number // $M
  best: number
  worst: number
}

export interface RegionDatum {
  region: RegionName
  funding: number
  projects: number
  ghgCommitted: number
  lidacShare: number // optional disadvantaged-community share (0–1)
}

export interface CountyDatum {
  fips: string
  name: string
  region: RegionName
  funding: number
  projects: number
  ghg: number // committed tCO2e
}

export interface IndustryDatum {
  name: string
  funding: number
  projects: number
}

/** Program-level totals (statewide, "All trimesters"). */
export interface ProgramTotals {
  pool: number
  obligated: number
  disbursed: number
  remaining: number
  projectsFunded: number
  applications: number
  ghgCommitted: number
  ghgRealized: number
  jobsCommitted: number
  jobsRealized: number
  deadline: string
  avgAward: number
  costPerTon: number
  countiesReached: number
  countiesTotal: number
  regionsCovered: number
  regionsTotal: number
  lidacShare: number
  // Iteration 2 only
  forecastObligatedByDeadline: number
  atRiskOfReturn: number
  paceStatus: PaceStatus
}

/** Deltas vs the previous trimester (Iteration 2 KPI badges). */
export interface Deltas {
  obligated: number
  disbursed: number
  projectsFunded: number
  ghgRealized: number
  jobsRealized: number
}

/** Timeline annotation for the pipeline/runway (Iteration 2). */
export interface Annotation {
  windowId: string
  title: string
  detail: string
}

/** A computed scope of the dataset, after the global filter is applied. */
export interface ScopedMetrics {
  scopeLabel: string
  obligated: number
  disbursed: number
  projectsFunded: number
  applications: number
  ghgCommitted: number
  ghgRealized: number
  jobsCommitted: number
  jobsRealized: number
  poolShareObligated: number // obligated / pool
  poolShareDisbursed: number
  deltas: Deltas | null // null for All-trimesters scope
}
