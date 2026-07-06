// RISE PA — geographic data (PRD §6.4).
// DEP region totals + region→county mapping, and a deterministic allocator that
// produces realistic per-county funding/projects/GHG summing EXACTLY to each
// region total. 59 of 67 counties have awards; the remaining (rural, low-mfg)
// counties render as an explicit "no projects yet" state, not as missing data.

import type { CountyDatum, IndustryDatum, RegionDatum, RegionName } from './types'

/* ── Region totals (roll up to statewide: $24.5M · 124 projects · 138k tCO₂e) ─ */
export const REGIONS: RegionDatum[] = [
  { region: 'Southwest', funding: 6_100_000, projects: 31, ghgCommitted: 34_000, lidacShare: 0.44 },
  { region: 'Southeast', funding: 5_400_000, projects: 27, ghgCommitted: 29_000, lidacShare: 0.51 },
  { region: 'Southcentral', funding: 4_600_000, projects: 23, ghgCommitted: 26_000, lidacShare: 0.33 },
  { region: 'Northeast', funding: 3_800_000, projects: 19, ghgCommitted: 21_000, lidacShare: 0.38 },
  { region: 'Northwest', funding: 2_700_000, projects: 14, ghgCommitted: 16_000, lidacShare: 0.29 },
  { region: 'Northcentral', funding: 1_900_000, projects: 10, ghgCommitted: 12_000, lidacShare: 0.22 },
]

/* ── Region → county mapping (PA DEP regional offices, §6.4) ──────────────── */
export const REGION_COUNTIES: Record<RegionName, string[]> = {
  Southeast: ['Bucks', 'Chester', 'Delaware', 'Montgomery', 'Philadelphia'],
  Northeast: ['Carbon', 'Lackawanna', 'Lehigh', 'Luzerne', 'Monroe', 'Northampton', 'Pike', 'Schuylkill', 'Susquehanna', 'Wayne', 'Wyoming'],
  Southcentral: ['Adams', 'Bedford', 'Berks', 'Blair', 'Cumberland', 'Dauphin', 'Franklin', 'Fulton', 'Huntingdon', 'Juniata', 'Lancaster', 'Lebanon', 'Mifflin', 'Perry', 'York'],
  Northcentral: ['Bradford', 'Cameron', 'Centre', 'Clearfield', 'Clinton', 'Columbia', 'Lycoming', 'Montour', 'Northumberland', 'Potter', 'Snyder', 'Sullivan', 'Tioga', 'Union'],
  Southwest: ['Allegheny', 'Armstrong', 'Beaver', 'Cambria', 'Fayette', 'Greene', 'Indiana', 'Somerset', 'Washington', 'Westmoreland'],
  Northwest: ['Butler', 'Clarion', 'Crawford', 'Elk', 'Erie', 'Forest', 'Jefferson', 'Lawrence', 'McKean', 'Mercer', 'Venango', 'Warren'],
}

const COUNTY_TO_REGION: Record<string, RegionName> = {}
for (const region of Object.keys(REGION_COUNTIES) as RegionName[]) {
  for (const c of REGION_COUNTIES[region]) COUNTY_TO_REGION[c] = region
}
export const countyRegion = (name: string): RegionName | undefined => COUNTY_TO_REGION[name]

/*
  Per-county distribution config. `f` = funding weight, `p` = project weight.
  Anchor counties (PRD §6.4) carry exact, named values; the remaining awarded
  counties split the rest of the region total by weight. Counties absent from a
  region's list here have NO awards yet (rendered neutral).
*/
type CountyCfg = { name: string; f: number; p: number; anchorF?: number; anchorP?: number }
const AWARDED: Record<RegionName, CountyCfg[]> = {
  Southwest: [
    { name: 'Allegheny', f: 0, p: 0, anchorF: 2_800_000, anchorP: 12 },
    { name: 'Westmoreland', f: 0, p: 0, anchorF: 900_000, anchorP: 5 },
    { name: 'Washington', f: 9, p: 4 },
    { name: 'Cambria', f: 6, p: 3 },
    { name: 'Fayette', f: 5, p: 2 },
    { name: 'Beaver', f: 4, p: 2 },
    { name: 'Indiana', f: 3, p: 1 },
    { name: 'Armstrong', f: 2, p: 1 },
    { name: 'Greene', f: 2, p: 1 },
    { name: 'Somerset', f: 2, p: 1 },
  ],
  Southeast: [
    { name: 'Philadelphia', f: 0, p: 0, anchorF: 2_100_000, anchorP: 9 },
    { name: 'Montgomery', f: 0, p: 0, anchorF: 1_300_000, anchorP: 6 },
    { name: 'Chester', f: 8, p: 5 },
    { name: 'Bucks', f: 7, p: 4 },
    { name: 'Delaware', f: 5, p: 3 },
  ],
  Southcentral: [
    { name: 'Lancaster', f: 0, p: 0, anchorF: 1_400_000, anchorP: 7 },
    { name: 'Dauphin', f: 0, p: 0, anchorF: 900_000, anchorP: 5 },
    { name: 'York', f: 9, p: 1 },
    { name: 'Berks', f: 7, p: 1 },
    { name: 'Cumberland', f: 6, p: 1 },
    { name: 'Lebanon', f: 4, p: 1 },
    { name: 'Franklin', f: 3, p: 1 },
    { name: 'Blair', f: 3, p: 1 },
    { name: 'Adams', f: 3, p: 1 },
    { name: 'Bedford', f: 2, p: 1 },
    { name: 'Huntingdon', f: 2, p: 1 },
    { name: 'Mifflin', f: 2, p: 1 },
    { name: 'Perry', f: 2, p: 1 },
  ],
  Northeast: [
    { name: 'Lehigh', f: 0, p: 0, anchorF: 1_100_000, anchorP: 6 },
    { name: 'Northampton', f: 8, p: 2 },
    { name: 'Luzerne', f: 6, p: 2 },
    { name: 'Lackawanna', f: 5, p: 2 },
    { name: 'Monroe', f: 4, p: 1 },
    { name: 'Schuylkill', f: 3, p: 1 },
    { name: 'Carbon', f: 2, p: 1 },
    { name: 'Pike', f: 2, p: 1 },
    { name: 'Wayne', f: 2, p: 1 },
    { name: 'Susquehanna', f: 1, p: 1 },
    { name: 'Wyoming', f: 1, p: 1 },
  ],
  Northcentral: [
    { name: 'Centre', f: 9, p: 1 },
    { name: 'Lycoming', f: 7, p: 1 },
    { name: 'Columbia', f: 5, p: 1 },
    { name: 'Northumberland', f: 4, p: 1 },
    { name: 'Clearfield', f: 3, p: 1 },
    { name: 'Union', f: 3, p: 1 },
    { name: 'Snyder', f: 2, p: 1 },
    { name: 'Montour', f: 2, p: 1 },
    { name: 'Clinton', f: 2, p: 1 },
    { name: 'Bradford', f: 2, p: 1 },
  ],
  Northwest: [
    { name: 'Erie', f: 0, p: 0, anchorF: 1_100_000, anchorP: 5 },
    { name: 'Mercer', f: 7, p: 1 },
    { name: 'Butler', f: 6, p: 1 },
    { name: 'Lawrence', f: 4, p: 1 },
    { name: 'Crawford', f: 3, p: 1 },
    { name: 'Venango', f: 2, p: 1 },
    { name: 'Clarion', f: 2, p: 1 },
    { name: 'Warren', f: 2, p: 1 },
    { name: 'McKean', f: 2, p: 1 },
    { name: 'Elk', f: 1, p: 1 },
  ],
}

/**
 * Largest-remainder allocator: distributes `total` across `weights` so the
 * result sums EXACTLY to `total`, each entry ≥ `min`, rounded to `step`.
 * Robust to any county count (no negative remainders).
 */
function allocate(total: number, weights: number[], min: number, step: number): number[] {
  const n = weights.length
  if (n === 0) return []
  const wSum = weights.reduce((a, b) => a + b, 0) || 1
  const remainingUnits = Math.max(0, Math.round((total - min * n) / step))
  const raw = weights.map((w) => (w / wSum) * remainingUnits)
  const floors = raw.map(Math.floor)
  const used = floors.reduce((a, b) => a + b, 0)
  const leftover = remainingUnits - used
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < leftover; k++) floors[order[k % n].i]++
  return weights.map((_, i) => min + floors[i] * step)
}

/** Build per-county data that sums EXACTLY to each region total. */
function buildCounties(): Record<string, CountyDatum> {
  const out: Record<string, CountyDatum> = {}
  for (const region of REGIONS) {
    const cfgs = AWARDED[region.region]
    const anchors = cfgs.filter((c) => c.anchorF != null)
    const rest = cfgs.filter((c) => c.anchorF == null)
    const anchorFunding = anchors.reduce((s, c) => s + (c.anchorF ?? 0), 0)
    const anchorProjects = anchors.reduce((s, c) => s + (c.anchorP ?? 0), 0)
    const fundingAlloc = allocate(region.funding - anchorFunding, rest.map((c) => c.f), 100_000, 100_000)
    const projectAlloc = allocate(region.projects - anchorProjects, rest.map((c) => c.p), 1, 1)

    const rows: { name: string; funding: number; projects: number }[] = []
    anchors.forEach((a) => rows.push({ name: a.name, funding: a.anchorF!, projects: a.anchorP! }))
    rest.forEach((c, i) => rows.push({ name: c.name, funding: fundingAlloc[i], projects: projectAlloc[i] }))

    for (const r of rows) {
      out[r.name] = {
        fips: FIPS_BY_NAME[r.name] ?? '',
        name: r.name,
        region: region.region,
        funding: r.funding,
        projects: r.projects,
        ghg: Math.round((r.funding / region.funding) * region.ghgCommitted),
      }
    }
  }
  return out
}

// FIPS codes for all 67 PA counties (used to key the choropleth).
const FIPS_BY_NAME: Record<string, string> = {
  Adams: '42001', Allegheny: '42003', Armstrong: '42005', Beaver: '42007', Bedford: '42009',
  Berks: '42011', Blair: '42013', Bradford: '42015', Bucks: '42017', Butler: '42019',
  Cambria: '42021', Cameron: '42023', Carbon: '42025', Centre: '42027', Chester: '42029',
  Clarion: '42031', Clearfield: '42033', Clinton: '42035', Columbia: '42037', Crawford: '42039',
  Cumberland: '42041', Dauphin: '42043', Delaware: '42045', Elk: '42047', Erie: '42049',
  Fayette: '42051', Forest: '42053', Franklin: '42055', Fulton: '42057', Greene: '42059',
  Huntingdon: '42061', Indiana: '42063', Jefferson: '42065', Juniata: '42067', Lackawanna: '42069',
  Lancaster: '42071', Lawrence: '42073', Lebanon: '42075', Lehigh: '42077', Luzerne: '42079',
  Lycoming: '42081', McKean: '42083', Mercer: '42085', Mifflin: '42087', Monroe: '42089',
  Montgomery: '42091', Montour: '42093', Northampton: '42095', Northumberland: '42097', Perry: '42099',
  Philadelphia: '42101', Pike: '42103', Potter: '42105', Schuylkill: '42107', Snyder: '42109',
  Somerset: '42111', Sullivan: '42113', Susquehanna: '42115', Tioga: '42117', Union: '42119',
  Venango: '42121', Warren: '42123', Washington: '42125', Wayne: '42127', Westmoreland: '42129',
  Wyoming: '42131', York: '42133',
}

export const COUNTY_DATA: Record<string, CountyDatum> = buildCounties()

/** Lookup a county's data by its FIPS id (from the GeoJSON). Undefined if no awards. */
const COUNTY_BY_FIPS: Record<string, CountyDatum> = {}
for (const name of Object.keys(COUNTY_DATA)) {
  const d = COUNTY_DATA[name]
  if (d.fips) COUNTY_BY_FIPS[d.fips] = d
}
export const countyByFips = (fips: string): CountyDatum | undefined => COUNTY_BY_FIPS[fips]

// Reverse map for ALL 67 counties (including those with no awards yet), so an
// empty county can still be named and located when selected.
const NAME_BY_FIPS: Record<string, string> = {}
for (const name of Object.keys(FIPS_BY_NAME)) NAME_BY_FIPS[FIPS_BY_NAME[name]] = name
export const countyNameByFips = (fips: string): string | undefined => NAME_BY_FIPS[fips]
export const countyFips = (name: string): string | undefined => FIPS_BY_NAME[name]

/* ── Per-area industry composition (§6.5) — ranked numbers, NO treemap ─────── */
export const INDUSTRIES_BY_REGION: Record<RegionName, IndustryDatum[]> = {
  Southwest: [
    { name: 'Fabricated Metal Products', funding: 1_800_000, projects: 9 },
    { name: 'Machinery Manufacturing', funding: 1_300_000, projects: 6 },
    { name: 'Chemical Manufacturing', funding: 1_100_000, projects: 5 },
    { name: 'Plastics & Rubber Products', funding: 900_000, projects: 6 },
    { name: 'Other', funding: 1_000_000, projects: 5 },
  ],
  Southeast: [
    { name: 'Food Manufacturing', funding: 1_500_000, projects: 7 },
    { name: 'Plastics & Rubber Products', funding: 1_200_000, projects: 6 },
    { name: 'Fabricated Metal Products', funding: 1_000_000, projects: 6 },
    { name: 'Chemical Manufacturing', funding: 800_000, projects: 4 },
    { name: 'Other', funding: 900_000, projects: 4 },
  ],
  Southcentral: [
    { name: 'Food Manufacturing', funding: 1_400_000, projects: 7 },
    { name: 'Fabricated Metal Products', funding: 1_100_000, projects: 6 },
    { name: 'Wood & Paper Products', funding: 800_000, projects: 4 },
    { name: 'Machinery Manufacturing', funding: 700_000, projects: 3 },
    { name: 'Other', funding: 600_000, projects: 3 },
  ],
  Northeast: [
    { name: 'Fabricated Metal Products', funding: 1_100_000, projects: 6 },
    { name: 'Food Manufacturing', funding: 900_000, projects: 5 },
    { name: 'Plastics & Rubber Products', funding: 700_000, projects: 4 },
    { name: 'Other', funding: 1_100_000, projects: 4 },
  ],
  Northwest: [
    { name: 'Plastics & Rubber Products', funding: 800_000, projects: 4 },
    { name: 'Fabricated Metal Products', funding: 700_000, projects: 4 },
    { name: 'Machinery Manufacturing', funding: 600_000, projects: 3 },
    { name: 'Other', funding: 600_000, projects: 3 },
  ],
  Northcentral: [
    { name: 'Wood & Paper Products', funding: 700_000, projects: 4 },
    { name: 'Food Manufacturing', funding: 500_000, projects: 3 },
    { name: 'Fabricated Metal Products', funding: 400_000, projects: 2 },
    { name: 'Other', funding: 300_000, projects: 1 },
  ],
}
