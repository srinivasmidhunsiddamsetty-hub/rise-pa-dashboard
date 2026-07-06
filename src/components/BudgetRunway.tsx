import { useState } from 'react'
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { Card, LegendDot, SectionHeading } from './ui'
import { ChartSkeleton } from './states/Skeleton'
import { DEPLOYMENT, FORECAST, POOL_M, PROGRAM } from '../data/program'
import type { FilterScope } from '../lib/selectors'
import { scopeWindowIds } from '../lib/selectors'
import { fmtCompact, fmtM, fmtMoneyShort, fmtPct } from '../lib/format'
import { cn } from '../lib/cn'

// Budget Runway + Forecast — the full-width HERO (PRD §5.2 / §7).
// Deployment is a rate-against-a-deadline question, so the most important
// question gets the most visual weight. Iteration 1 = historical/current only.
// Iteration 2 = + dashed forecast band, on-pace status, at-risk callout, and a
// Dollars/GHG/Jobs metric toggle (impact pace without a separate section, §12.2).

type Metric = 'dollars' | 'ghg'

const METRICS: { key: Metric; label: string }[] = [
  { key: 'dollars', label: 'Dollars' },
  { key: 'ghg', label: 'GHG' },
]

// Per-metric scaling from the $M cumulative series to committed/realized impact.
function metricConfig(metric: Metric) {
  if (metric === 'ghg') {
    return {
      committedScale: PROGRAM.ghgCommitted / (PROGRAM.obligated / 1_000_000), // per $M
      realizedScale: PROGRAM.ghgRealized / (PROGRAM.disbursed / 1_000_000),
      ceiling: null as number | null,
      unit: 'tCO₂e/yr',
      committedLabel: 'Committed (at award)',
      realizedLabel: 'Realized (verified)',
      fmt: (v: number) => fmtCompact(v),
    }
  }
  return {
    committedScale: 1,
    realizedScale: 1,
    ceiling: POOL_M,
    unit: '$M',
    committedLabel: 'Obligated (committed)',
    realizedLabel: 'Disbursed (paid)',
    fmt: (v: number) => fmtM(v),
  }
}

interface Row {
  label: string
  committed?: number
  realized?: number
  fExpected?: number
  fBand?: [number, number]
}

function buildData(
  metric: Metric,
  showForecast: boolean,
  scopeIds: string[] | null,
): { rows: Row[]; deadlineLabel: string } {
  const c = metricConfig(metric)

  // When scoped, run the cumulative line only up to the latest in-scope window
  // that has data — never beyond the selected trimester/year.
  let series = DEPLOYMENT
  if (scopeIds) {
    const idxs = scopeIds
      .map((id) => DEPLOYMENT.findIndex((p) => p.windowId === id))
      .filter((i) => i >= 0)
    const cutoff = idxs.length ? Math.max(...idxs) : DEPLOYMENT.length - 1
    series = DEPLOYMENT.slice(0, cutoff + 1)
  }

  const rows: Row[] = series.map((p) => ({
    label: p.label,
    committed: +(p.obligated * c.committedScale).toFixed(metric === 'dollars' ? 1 : 0),
    realized: +(p.disbursed * c.realizedScale).toFixed(metric === 'dollars' ? 1 : 0),
  }))

  if (showForecast) {
    // Forecast continuation (committed basis), scaled per metric.
    FORECAST.forEach((f, i) => {
      const expected = +(f.expected * c.committedScale).toFixed(metric === 'dollars' ? 1 : 0)
      const band: [number, number] = [
        +(f.worst * c.committedScale).toFixed(metric === 'dollars' ? 1 : 0),
        +(f.best * c.committedScale).toFixed(metric === 'dollars' ? 1 : 0),
      ]
      if (i === 0) {
        // Anchor the dashed forecast to the current actual point (T2.2).
        const last = rows[rows.length - 1]
        last.fExpected = expected
        last.fBand = band
      } else {
        rows.push({ label: f.label, fExpected: expected, fBand: band })
      }
    })
  }
  return { rows, deadlineLabel: 'Apr 2028' }
}

function RunwayTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; value?: number; payload?: Row }>
  label?: string
  metric: Metric
}) {
  if (!active || !payload?.length) return null
  const c = metricConfig(metric)
  const row = payload[0]?.payload
  if (!row) return null
  const isForecast = row.committed == null
  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
      <p className="mb-1.5 font-semibold text-[var(--color-ink)]">{label}</p>
      {!isForecast ? (
        <div className="space-y-1">
          <Row2 color="var(--color-realized)" label={c.committedLabel} value={c.fmt(row.committed!)} />
          <Row2 color="var(--color-committed)" label={c.realizedLabel} value={c.fmt(row.realized!)} />
          {metric === 'dollars' && (
            <div className="mt-1 border-t border-[var(--color-border)] pt-1 text-[11px] text-[var(--color-ink-2)]">
              Gap (lag): {fmtM((row.committed ?? 0) - (row.realized ?? 0))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-[172px]">
          <p className="mb-1.5 text-[11px] text-[var(--color-ink-3)]">Projected range</p>
          {row.fBand && (
            <RangeWhisker worst={row.fBand[0]} best={row.fBand[1]} expected={row.fExpected!} fmt={c.fmt} />
          )}
        </div>
      )}
    </div>
  )
}

function Row2({
  color,
  label,
  value,
  dashed,
}: {
  color: string
  label: string
  value: string
  dashed?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-[var(--color-ink-2)]">
        <span
          className={cn('inline-block h-2 w-2 rounded-[2px]', dashed && 'ring-1 ring-inset')}
          style={{ background: dashed ? 'transparent' : color, borderColor: color }}
        />
        {label}
      </span>
      <span className="tnum font-medium text-[var(--color-ink)]">{value}</span>
    </div>
  )
}

// Forecast range shown as a vertical error-bar (whisker): best on top, worst on
// bottom, a ringed marker at the expected value — reads as an uncertainty range,
// not a draggable slider.
function RangeWhisker({
  worst,
  best,
  expected,
  fmt,
}: {
  worst: number
  best: number
  expected: number
  fmt: (v: number) => string
}) {
  const TOP = 6
  const BOT = 46
  const frac = best === worst ? 0.5 : (expected - worst) / (best - worst)
  const yExp = BOT - frac * (BOT - TOP)
  const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div className="flex items-center justify-between gap-3">
      <span className={accent ? 'font-medium text-[var(--color-accent)]' : 'text-[var(--color-ink-3)]'}>
        {label}
      </span>
      <span
        className={cn(
          'tnum',
          accent ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-ink)]',
        )}
      >
        {value}
      </span>
    </div>
  )
  return (
    <div className="flex items-stretch gap-3">
      <svg width="14" height="52" className="shrink-0" aria-hidden="true">
        <line x1="7" y1={TOP} x2="7" y2={BOT} stroke="var(--color-accent)" strokeOpacity="0.45" strokeWidth="1.5" />
        <line x1="3" y1={TOP} x2="11" y2={TOP} stroke="var(--color-accent)" strokeOpacity="0.7" strokeWidth="1.5" />
        <line x1="3" y1={BOT} x2="11" y2={BOT} stroke="var(--color-accent)" strokeOpacity="0.7" strokeWidth="1.5" />
        <circle cx="7" cy={yExp} r="3.4" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="1.5" />
      </svg>
      <div className="flex flex-1 flex-col justify-between py-0.5 text-[12px]">
        <Row label="Best" value={fmt(best)} />
        <Row label="Expected" value={fmt(expected)} accent />
        <Row label="Worst" value={fmt(worst)} />
      </div>
    </div>
  )
}

export function BudgetRunway({
  scope,
  iteration,
  loading,
}: {
  scope: FilterScope
  iteration: 1 | 2
  loading: boolean
}) {
  const [metric, setMetric] = useState<Metric>('dollars')
  const activeMetric: Metric = iteration === 1 ? 'dollars' : metric
  const c = metricConfig(activeMetric)
  // Forecast is a program-level "will we hit the April 2028 deadline?" view — it
  // only makes sense across ALL trimesters, not a single completed window/year.
  const showForecast = iteration === 2 && scope.mode === 'all'
  // The scope highlights which window(s) are in view on the trajectory.
  const scopedIds = scope.mode === 'all' ? [] : scopeWindowIds(scope)
  const { rows, deadlineLabel } = buildData(
    activeMetric,
    showForecast,
    scope.mode === 'all' ? null : scopedIds,
  )

  const yMax =
    activeMetric === 'dollars'
      ? iteration === 2
        ? 45
        : 42
      : Math.ceil(Math.max(...rows.map((r) => Math.max(r.committed ?? 0, r.fBand?.[1] ?? 0))) * 1.1)
  // Iteration 2 uses clean dollar ticks incl. the $40M ceiling as an axis value;
  // Iteration 1 keeps recharts' default ticks (basic).
  const yTicks = activeMetric === 'dollars' && iteration === 2 ? [0, 15, 30, 40, 45] : undefined

  return (
    <Card className="p-5">
      <SectionHeading
        eyebrow="Deployment pace"
        title={showForecast ? 'Budget Runway & Forecast' : 'Budget Deployment'}
        right={
          iteration === 2 ? (
            <div
              role="radiogroup"
              aria-label="Runway metric"
              className="inline-flex items-center rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
            >
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  role="radio"
                  aria-checked={activeMetric === m.key}
                  onClick={() => setMetric(m.key)}
                  className={cn(
                    'rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors',
                    activeMetric === m.key
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <LegendDot color="var(--color-realized)" label={c.committedLabel} />
        <LegendDot color="var(--color-committed)" label={c.realizedLabel} />
        {showForecast && activeMetric === 'dollars' && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-2)]">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[var(--color-accent)]" />
            Forecast (best–worst band)
          </span>
        )}
      </div>

      {/* Accessible text alternative for the chart (PRD §10). */}
      <p className="sr-only">
        {`Cumulative deployment: ${fmtMoneyShort(PROGRAM.obligated)} obligated (${fmtPct(
          PROGRAM.obligated / PROGRAM.pool,
        )} of the ${fmtMoneyShort(PROGRAM.pool)} pool) and ${fmtMoneyShort(
          PROGRAM.disbursed,
        )} disbursed by the current window.`}
        {showForecast
          ? ` At current pace, ~${fmtMoneyShort(
              PROGRAM.forecastObligatedByDeadline,
            )} is projected by the April 2028 deadline, leaving ~${fmtMoneyShort(
              PROGRAM.atRiskOfReturn,
            )} at risk of return to the EPA.`
          : ''}
      </p>
      <div className="mt-2 h-[300px] w-full">
        {loading ? (
          <ChartSkeleton height={300} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 12, right: 30, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="gradCommitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradRealized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-committed)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-committed)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.06} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="var(--color-border)" vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
                dy={6}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={46}
                tickFormatter={(v) => (activeMetric === 'dollars' ? `$${v}M` : fmtCompact(v))}
              />
              <Tooltip
                content={<RunwayTooltip metric={activeMetric} />}
                cursor={{ stroke: 'var(--color-border-strong)', strokeWidth: 1 }}
              />

              {/* Scope highlight: shade the window(s) in view */}
              {scopedIds.length > 0 &&
                rows.some((r) => scopedIds.includes(r.label)) && (
                  <ReferenceLine
                    x={rows.find((r) => scopedIds.includes(r.label))?.label}
                    stroke="var(--color-accent)"
                    strokeOpacity={0.35}
                    strokeWidth={1}
                  />
                )}

              {/* $40M ceiling (dollars only). Iteration 1 labels it "$40M ceiling"
                  on the plot; Iteration 2 labels the value on the y-axis tick. */}
              {c.ceiling != null && (
                <ReferenceLine
                  y={c.ceiling}
                  stroke="var(--color-ink-3)"
                  strokeDasharray="5 4"
                  strokeWidth={1.25}
                  label={
                    iteration === 1
                      ? {
                          value: `$${c.ceiling}M ceiling`,
                          position: 'insideTopRight',
                          fill: 'var(--color-ink-2)',
                          fontSize: 11,
                          fontWeight: 600,
                        }
                      : undefined
                  }
                />
              )}

              {/* Forecast band + dashed expected — only across all trimesters.
                  Gradient fill + a soft outline so best/worst read as a fan. */}
              {showForecast && (
                <Area
                  type="monotone"
                  dataKey="fBand"
                  stroke="var(--color-accent)"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                  fill="url(#gradForecast)"
                  fillOpacity={1}
                  isAnimationActive={false}
                  connectNulls
                />
              )}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="fExpected"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}

              {/* Realized (paid / verified) — committed tint */}
              <Area
                type="monotone"
                dataKey="realized"
                stroke="var(--color-committed)"
                strokeWidth={2}
                fill="url(#gradRealized)"
                dot={{ r: 2.5, fill: 'var(--color-committed)', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={600}
              />
              {/* Committed (obligated) — solid indigo, drawn on top */}
              <Area
                type="monotone"
                dataKey="committed"
                stroke="var(--color-realized)"
                strokeWidth={2.5}
                fill="url(#gradCommitted)"
                dot={{ r: 2.5, fill: 'var(--color-realized)', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={600}
              />

              {/* Deadline marker — only in the forecast (all-trimesters) view. */}
              {showForecast && (
                <ReferenceLine
                  x={deadlineLabel}
                  stroke="var(--color-ink-2)"
                  strokeWidth={1.25}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* At-risk-of-return callout — the single highest-value I2 addition (§12.1).
          Program-level, so only in the all-trimesters forecast view. */}
      {showForecast && !loading && (
        <div className="mt-4 flex items-center gap-2.5 rounded-[10px] border border-[#f5e6c8] bg-[#fdf9f0] px-3.5 py-3">
          <AlertTriangle size={16} className="shrink-0 text-[var(--color-warning)]" />
          <p className="truncate text-[13px] text-[var(--color-ink)]">
            At current pace,{' '}
            <span className="font-semibold">
              ~{fmtMoneyShort(PROGRAM.forecastObligatedByDeadline)}
            </span>{' '}
            of {fmtMoneyShort(PROGRAM.pool)} obligated by April 2028 —{' '}
            <span className="font-semibold text-[var(--color-warning)]">
              ~{fmtMoneyShort(PROGRAM.atRiskOfReturn)} (
              {fmtPct(PROGRAM.atRiskOfReturn / PROGRAM.pool)})
            </span>{' '}
            at risk of return to the EPA.
          </p>
        </div>
      )}
    </Card>
  )
}
