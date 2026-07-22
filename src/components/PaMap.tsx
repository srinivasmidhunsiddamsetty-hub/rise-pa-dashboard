import { useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { ChevronDown, X } from 'lucide-react'
import { Card, SectionHeading } from './ui'
import { Skeleton } from './states/Skeleton'
import paGeo from '../data/pa-counties.json'
import { countyFips, countyNameByFips, COUNTY_DATA, countyRegion, REGION_COUNTIES } from '../data/regions'
import type { CountyDatum, RegionName } from '../data/types'
import type { AreaLevel, AreaSelection } from '../lib/selectors'
import { REGIONS } from '../data/regions'
import { fmtCompact, fmtMoneyShort } from '../lib/format'
import { cn } from '../lib/cn'

// PA choropleth (PRD §7.4). County ⇄ region toggle, hover tooltip, click-to-lock.
// Iteration 1 = basic (Funding/Projects/GHG metric filters, hover shows metrics,
// no jump-to dropdown). Iteration 2 = refined (funding only, name-only hover,
// jump-to dropdown, selectable empty counties).

type MapMetric = 'funding' | 'projects' | 'ghg'
const MAP_METRICS: { key: MapMetric; label: string }[] = [
  { key: 'funding', label: 'Funding' },
  { key: 'projects', label: 'Projects' },
  { key: 'ghg', label: 'GHG' },
]

const COUNTY_BY_FIPS: Record<string, CountyDatum> = {}
for (const name of Object.keys(COUNTY_DATA)) {
  const d = COUNTY_DATA[name]
  if (d.fips) COUNTY_BY_FIPS[d.fips] = d
}
const REGION_BY_NAME = Object.fromEntries(REGIONS.map((r) => [r.region, r]))

function metricCounty(d: CountyDatum | undefined, m: MapMetric): number {
  if (!d) return 0
  return m === 'funding' ? d.funding : m === 'projects' ? d.projects : d.ghg
}
function metricRegion(name: RegionName, m: MapMetric): number {
  const r = REGION_BY_NAME[name]
  if (!r) return 0
  return m === 'funding' ? r.funding : m === 'projects' ? r.projects : r.ghgCommitted
}

interface HoverInfo {
  name: string
  funding: number
  projects: number
  ghg: number
  x: number
  y: number
}

export function PaMap({
  level,
  onLevel,
  selection,
  onSelect,
  loading,
  iteration,
}: {
  level: AreaLevel
  onLevel: (l: AreaLevel) => void
  selection: AreaSelection
  onSelect: (s: AreaSelection) => void
  loading: boolean
  iteration: 1 | 2
}) {
  const refined = iteration === 2
  const [metric, setMetric] = useState<MapMetric>('funding')
  const activeMetric: MapMetric = refined ? 'funding' : metric
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Iteration 2 uses a deeper, higher-impact ramp; Iteration 1 keeps the softer one.
  const ramp = refined
    ? ['#c4d6ef', '#4f7fbd', '#123663']
    : ['#dce6f4', '#7ba0cd', '#1f4e96']
  const colorScale = useMemo(() => {
    const values =
      level === 'county'
        ? Object.values(COUNTY_BY_FIPS).map((d) => metricCounty(d, activeMetric))
        : REGIONS.map((r) => metricRegion(r.region, activeMetric))
    const max = Math.max(...values, 1)
    return scaleLinear<string>()
      .domain([0, max * 0.5, max])
      .range(ramp)
      .clamp(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, activeMetric, refined])

  function fillFor(fips: string, name: string): string {
    const d = COUNTY_BY_FIPS[fips]
    if (level === 'county') {
      if (!d) return 'var(--color-ramp-0)'
      return colorScale(metricCounty(d, activeMetric))
    }
    const regionName = d?.region ?? countyRegion(name)
    if (!regionName) return 'var(--color-ramp-0)'
    return colorScale(metricRegion(regionName, activeMetric))
  }

  function isSelected(fips: string, regionName?: RegionName): boolean {
    if (!selection) return false
    if (selection.level === 'county') return level === 'county' && selection.fips === fips
    return level === 'region' && !!regionName && selection.name === regionName
  }

  function handleEnterMove(fips: string, name: string, evt: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect()
    const d = COUNTY_BY_FIPS[fips]
    if (level === 'county') {
      setHover({
        name: `${name} County`,
        funding: d?.funding ?? 0,
        projects: d?.projects ?? 0,
        ghg: d?.ghg ?? 0,
        x: evt.clientX - (rect?.left ?? 0),
        y: evt.clientY - (rect?.top ?? 0),
      })
    } else {
      const regionName = d?.region ?? countyRegion(name)
      const r = regionName ? REGION_BY_NAME[regionName] : undefined
      setHover({
        name: regionName ? `${regionName} region` : `${name} County`,
        funding: r?.funding ?? 0,
        projects: r?.projects ?? 0,
        ghg: r?.ghgCommitted ?? 0,
        x: evt.clientX - (rect?.left ?? 0),
        y: evt.clientY - (rect?.top ?? 0),
      })
    }
  }

  function handleClick(fips: string, name: string) {
    const d = COUNTY_BY_FIPS[fips]
    if (level === 'county') {
      // Iteration 1: empty counties aren't selectable; Iteration 2 they are.
      if (!d && !refined) return
      onSelect(selection?.level === 'county' && selection.fips === fips ? null : { level: 'county', fips })
    } else {
      const regionName = d?.region ?? countyRegion(name)
      if (!regionName) return
      onSelect(
        selection?.level === 'region' && selection.name === regionName
          ? null
          : { level: 'region', name: regionName },
      )
    }
  }

  function handlePick(value: string) {
    if (!value) return onSelect(null)
    if (level === 'county') onSelect({ level: 'county', fips: value })
    else onSelect({ level: 'region', name: value as RegionName })
  }
  const pickValue =
    selection?.level === 'county' ? selection.fips : selection?.level === 'region' ? selection.name : ''
  const pickLabel =
    selection?.level === 'county'
      ? (countyNameByFips(selection.fips) ?? 'County')
      : selection?.level === 'region'
        ? selection.name
        : level === 'county'
          ? 'County'
          : 'Region'

  // Accessible text alternative for the choropleth (PRD §10 — maps aren't
  // screen-reader-friendly alone), listing the highest-funded areas.
  const mapSummary =
    level === 'county'
      ? `Pennsylvania funding by county, ${Object.keys(COUNTY_BY_FIPS).length} of 67 counties funded. Highest-funded: ` +
        Object.values(COUNTY_BY_FIPS)
          .sort((a, b) => b.funding - a.funding)
          .slice(0, 5)
          .map((d) => `${d.name} ${fmtMoneyShort(d.funding)}`)
          .join(', ') +
        '.'
      : `Pennsylvania funding by DEP region. ` +
        [...REGIONS]
          .sort((a, b) => b.funding - a.funding)
          .map((r) => `${r.region} ${fmtMoneyShort(r.funding)}`)
          .join(', ') +
        '.'

  const LevelToggle = (
    <div
      role="radiogroup"
      aria-label="Map granularity"
      className="inline-flex items-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
    >
      {(['county', 'region'] as AreaLevel[]).map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={level === l}
          onClick={() => {
            onLevel(l)
            onSelect(null)
          }}
          className={cn(
            'rounded-[6px] px-3 py-1 text-[12px] font-medium capitalize transition-colors',
            level === l
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )

  return (
    <Card className="flex flex-col p-4">
      {refined ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">State map</h2>
          <div className="flex items-center gap-2">
            {/* Jump-to dropdown — custom so it opens DOWNWARD (native <select>
                pops a macOS menu that can appear above the control). */}
            <div className="relative">
              <button
                type="button"
                aria-label={level === 'county' ? 'Jump to a county' : 'Jump to a region'}
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-3 pr-2 text-[12px] font-medium text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-border-strong)]"
              >
                <span className="min-w-[56px] text-left">{pickLabel}</span>
                <ChevronDown size={14} className="text-[var(--color-ink-3)]" />
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                  <div className="absolute right-0 top-full z-30 mt-1 max-h-[300px] w-[200px] overflow-auto rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
                    {level === 'county'
                      ? REGIONS.map((r) => (
                          <div key={r.region}>
                            <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                              {r.region}
                            </p>
                            {[...REGION_COUNTIES[r.region]].sort().map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  handlePick(countyFips(name) ?? '')
                                  setPickerOpen(false)
                                }}
                                className={cn(
                                  'block w-full rounded-[6px] px-2 py-1 text-left text-[12.5px] transition-colors hover:bg-[var(--color-surface-2)]',
                                  pickValue === countyFips(name)
                                    ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-strong)]'
                                    : 'text-[var(--color-ink-2)]',
                                )}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        ))
                      : REGIONS.map((r) => (
                          <button
                            key={r.region}
                            type="button"
                            onClick={() => {
                              handlePick(r.region)
                              setPickerOpen(false)
                            }}
                            className={cn(
                              'block w-full rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--color-surface-2)]',
                              pickValue === r.region
                                ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-strong)]'
                                : 'text-[var(--color-ink-2)]',
                            )}
                          >
                            {r.region}
                          </button>
                        ))}
                  </div>
                </>
              )}
            </div>
            {LevelToggle}
          </div>
        </div>
      ) : (
        <>
          <SectionHeading eyebrow="Statewide reach" title="Funding by area" right={LevelToggle} />
          {/* Metric selector + clear (Iteration 1) */}
          <div className="mt-3 flex items-center justify-between">
            <div
              role="radiogroup"
              aria-label="Shade by metric"
              className="inline-flex items-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
            >
              {MAP_METRICS.map((m) => (
                <button
                  key={m.key}
                  role="radio"
                  aria-checked={metric === m.key}
                  onClick={() => setMetric(m.key)}
                  className={cn(
                    'rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors',
                    metric === m.key
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                      : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {selection && (
              <button
                onClick={() => onSelect(null)}
                className="inline-flex items-center gap-1 rounded-[7px] border border-[var(--color-border)] px-2 py-1 text-[12px] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
              >
                <X size={13} /> Clear selection
              </button>
            )}
          </div>
        </>
      )}

      {/* Map */}
      <p className="sr-only">{mapSummary}</p>
      <div ref={wrapRef} className="relative mt-2 flex-1" onMouseLeave={() => setHover(null)}>
        {loading ? (
          <Skeleton className="aspect-[3/2] w-full rounded-[12px]" />
        ) : (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [-77.6, 41.0], scale: 4500 }}
            width={560}
            height={372}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={paGeo as object}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties: { name: string } }> }) =>
                geographies.map((geo) => {
                  const fips = String(geo.id)
                  const name = geo.properties.name
                  const d = COUNTY_BY_FIPS[fips]
                  const regionName = d?.region ?? countyRegion(name)
                  const selected = isSelected(fips, regionName)
                  const clickable = refined || !!d || level === 'region'
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      tabIndex={-1}
                      onMouseEnter={(e: React.MouseEvent) => handleEnterMove(fips, name, e)}
                      onMouseMove={(e: React.MouseEvent) => handleEnterMove(fips, name, e)}
                      onClick={() => handleClick(fips, name)}
                      style={{
                        default: {
                          fill: fillFor(fips, name),
                          stroke: selected ? 'var(--color-accent-strong)' : '#ffffff',
                          strokeWidth: selected ? 1.8 : 0.6,
                          outline: 'none',
                          cursor: clickable ? 'pointer' : 'default',
                          transition: 'fill 220ms ease',
                        },
                        hover: {
                          fill: fillFor(fips, name),
                          stroke: 'var(--color-accent-strong)',
                          strokeWidth: 1.4,
                          outline: 'none',
                          cursor: clickable ? 'pointer' : 'default',
                        },
                        pressed: { fill: fillFor(fips, name), outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ComposableMap>
        )}

        {/* Hover tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
            style={{ left: hover.x, top: hover.y }}
          >
            <p className="font-semibold text-[var(--color-ink)]">{hover.name}</p>
            {/* Iteration 1 shows metrics on hover; Iteration 2 is name-only. */}
            {!refined &&
              (hover.funding > 0 ? (
                <div className="tnum mt-0.5 space-y-0.5 text-[var(--color-ink-2)]">
                  <div>{fmtMoneyShort(hover.funding)} · {hover.projects} projects funded</div>
                  <div>{fmtCompact(hover.ghg)} tCO₂e committed</div>
                </div>
              ) : (
                <p className="mt-0.5 text-[var(--color-ink-3)]">No projects funded yet</p>
              ))}
          </div>
        )}
      </div>

      {/* Compact ramp legend */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-3)]">
          <span>Lower</span>
          <span
            className="h-2.5 w-28 rounded-full"
            style={{ background: `linear-gradient(90deg, ${ramp[0]}, ${ramp[1]}, ${ramp[2]})` }}
          />
          <span>Higher</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-3)]">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--color-ramp-0)' }} />
          {refined ? 'No projects yet' : 'No awards yet'}
        </span>
      </div>
    </Card>
  )
}
