import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, ChevronLeft, Inbox, Leaf, Map, MapPin, Users, Wallet } from 'lucide-react'
import { Card, SectionHeading } from './ui'
import { Skeleton } from './states/Skeleton'
import type { AreaInsight } from '../lib/selectors'
import { fmtCompact, fmtInt, fmtMoneyShort, fmtPct } from '../lib/format'
import { cn } from '../lib/cn'

// Contextual Area Insights (PRD §7.4).
// Iteration 1 = basic panel (loose stat rows, committed only, LIDAC line).
// Iteration 2 = refined equal-size cards + committed→realized + empty state.

function RankedBars({
  items,
  max,
  fmt,
}: {
  items: { label: string; value: number }[]
  max: number
  fmt: (v: number) => string
}) {
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: i * 0.03 }}
          className="grid grid-cols-[1fr_auto] items-center gap-3"
        >
          <div className="min-w-0">
            <span className="truncate text-[12.5px] text-[var(--color-ink-2)]">{it.label}</span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                style={{ width: `${max > 0 ? (it.value / max) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="tnum w-14 text-right text-[12.5px] font-semibold text-[var(--color-ink)]">
            {fmt(it.value)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

/* ══ Iteration 1 · basic stat rows ════════════════════════════════════════ */
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
        {label}
      </p>
      <p className="display-num mt-0.5 text-[22px] font-semibold text-[var(--color-ink)]">{value}</p>
      {sub && <p className="text-[12px] text-[var(--color-ink-2)]">{sub}</p>}
    </div>
  )
}

function BasicPanel({ insight, onClear }: { insight: AreaInsight; onClear: () => void }) {
  const isStatewide = insight.type === 'statewide'
  return (
    <div>
      {isStatewide ? (
        <SectionHeading eyebrow="Area insights" title="Statewide overview" subtitle="No area selected" />
      ) : (
        <div>
          <button
            onClick={onClear}
            className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ChevronLeft size={14} /> Back to statewide
          </button>
          <SectionHeading
            eyebrow={insight.type === 'region' ? 'DEP region' : 'County'}
            title={insight.name}
            subtitle={`${fmtPct(insight.fundingShare, 1)} of statewide funding`}
            right={<MapPin size={18} className="text-[var(--color-accent)]" />}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
        <Stat
          label="Funding deployed"
          value={fmtMoneyShort(insight.funding)}
          sub={isStatewide ? 'of $40M pool' : `${fmtPct(insight.fundingShare, 1)} of statewide`}
        />
        <Stat label="Projects funded" value={fmtInt(insight.projects)} />
        {isStatewide && (
          <>
            <Stat label="Counties reached" value={`${insight.countiesReached} / ${insight.countiesTotal}`} />
            <Stat label="Regions covered" value={`${insight.regionsCovered} / ${insight.regionsTotal}`} />
          </>
        )}
        <Stat label="GHG impact" value={fmtCompact(insight.ghgCommitted)} sub="tCO₂e committed" />
        <Stat label="Jobs" value={fmtInt(insight.jobsCommitted)} sub="committed" />
      </div>

      <div className="my-5 h-px bg-[var(--color-border)]" />

      {isStatewide && insight.topRegions ? (
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[var(--color-ink)]">Top regions by funding</p>
          <RankedBars
            items={insight.topRegions.map((r) => ({ label: r.region, value: r.funding }))}
            max={Math.max(...insight.topRegions.map((r) => r.funding))}
            fmt={fmtMoneyShort}
          />
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-[var(--color-ink-3)]">
          Industry composition and committed-vs-realized detail for this area arrive in the
          decision-support layer.
        </p>
      )}
    </div>
  )
}

/* ══ Iteration 2 · refined metric cards ═══════════════════════════════════ */
// White cards that lift off the panel with a soft shadow; label top, value at a
// fixed position so numbers align across all boxes; optional unit below.
const CARD =
  'flex items-start gap-3 rounded-[12px] border border-[#dbe6f5] bg-[var(--color-surface)] px-3.5 py-3.5 shadow-[0_1px_3px_rgba(31,78,150,0.10),0_6px_16px_rgba(31,78,150,0.08)]'
const CARD_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-2)]'

function MetricCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string
  value: string
  unit?: string
  icon: ReactNode
}) {
  return (
    <div className={CARD}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={CARD_LABEL}>{label}</p>
        <p className="display-num mt-1 text-[26px] font-semibold leading-none text-[var(--color-ink)]">
          {value}
          {unit && (
            <span className="ml-1 text-[11px] font-normal text-[var(--color-ink-3)]">{unit}</span>
          )}
        </p>
      </div>
    </div>
  )
}

function RefinedPanel({
  insight,
  scoped,
  onClear,
}: {
  insight: AreaInsight
  scoped: boolean
  onClear: () => void
}) {
  const isStatewide = insight.type === 'statewide'
  // Statewide funding can be broken down by sector (industries) or place (regions).
  const [dim, setDim] = useState<'regions' | 'industries'>('industries')
  return (
    <div className="flex h-full flex-col">
      {isStatewide ? (
        <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">Statewide</h3>
      ) : (
        <div>
          <button
            onClick={onClear}
            className="mb-1 inline-flex items-center gap-1 text-[12px] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ChevronLeft size={14} /> Statewide
          </button>
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] font-semibold text-[var(--color-ink)]">{insight.name}</h3>
            {!insight.empty && (
              <span className="tnum text-[12px] text-[var(--color-ink-2)]">
                {fmtPct(insight.fundingShare, 1)} of state
              </span>
            )}
          </div>
          {insight.empty && insight.regionName && (
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">{insight.regionName} region</p>
          )}
        </div>
      )}

      {insight.empty ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-6 py-10 text-center">
          <Inbox size={22} className="text-[var(--color-ink-3)]" />
          <p className="mt-2 text-[14px] font-semibold text-[var(--color-ink)]">No projects funded yet</p>
          <p className="mt-1 max-w-[30ch] text-[12px] leading-relaxed text-[var(--color-ink-2)]">
            {insight.name} hasn’t been funded{scoped ? ' in this period' : ''}.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MetricCard
              label="Funding"
              value={fmtMoneyShort(insight.disbursed)}
              icon={<Wallet size={24} strokeWidth={2.5} />}
            />
            <MetricCard
              label="Projects Funded"
              value={fmtInt(insight.projects)}
              icon={<Users size={24} strokeWidth={2.5} />}
            />
            {isStatewide && (
              <>
                <MetricCard
                  label="Counties Reached"
                  value={`${insight.countiesReached} / ${insight.countiesTotal}`}
                  icon={<MapPin size={24} strokeWidth={2.5} />}
                />
                <MetricCard
                  label="Regions Covered"
                  value={`${insight.regionsCovered} / ${insight.regionsTotal}`}
                  icon={<Map size={24} strokeWidth={2.5} />}
                />
              </>
            )}
            <MetricCard
              label="GHG Impact"
              value={fmtCompact(insight.ghgRealized)}
              unit="tCO₂e/yr"
              icon={<Leaf size={24} strokeWidth={2.5} />}
            />
            <MetricCard
              label="Jobs"
              value={fmtInt(insight.jobsRealized)}
              icon={<Briefcase size={24} strokeWidth={2.5} />}
            />
          </div>

          {isStatewide && insight.topRegions ? (
            <div className="mt-4">
              {/* Heading row carries the Regions/Industries toggle — swaps the
                  list in place, so no extra height (stays above the fold). */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-[var(--color-ink)]">Top by funding</p>
                <div
                  role="radiogroup"
                  aria-label="Break down by"
                  className="inline-flex items-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
                >
                  {(['industries', 'regions'] as const).map((d) => (
                    <button
                      key={d}
                      role="radio"
                      aria-checked={dim === d}
                      onClick={() => setDim(d)}
                      className={cn(
                        'rounded-[6px] px-2 py-0.5 text-[11px] font-medium capitalize transition-colors',
                        dim === d
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {dim === 'regions' ? (
                <RankedBars
                  items={insight.topRegions.map((r) => ({ label: r.region, value: r.funding }))}
                  max={Math.max(...insight.topRegions.map((r) => r.funding))}
                  fmt={fmtMoneyShort}
                />
              ) : (
                <RankedBars
                  items={insight.industries.slice(0, 6).map((it) => ({ label: it.name, value: it.funding }))}
                  max={Math.max(...insight.industries.map((it) => it.funding))}
                  fmt={fmtMoneyShort}
                />
              )}
            </div>
          ) : !isStatewide && insight.industries.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[12.5px] font-semibold text-[var(--color-ink)]">Top industries</p>
              <RankedBars
                items={insight.industries.slice(0, 4).map((it) => ({ label: it.name, value: it.funding }))}
                max={Math.max(...insight.industries.map((it) => it.funding))}
                fmt={fmtMoneyShort}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export function AreaInsights({
  insight,
  iteration,
  loading,
  scoped,
  onClear,
}: {
  insight: AreaInsight
  iteration: 1 | 2
  loading: boolean
  scoped: boolean
  onClear: () => void
}) {
  const body: ReactNode = loading ? (
    <div className="space-y-3">
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full" />
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  ) : (
    <AnimatePresence mode="wait">
      <motion.div
        key={insight.type + insight.name}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {iteration === 2 ? (
          <RefinedPanel insight={insight} scoped={scoped} onClear={onClear} />
        ) : (
          <BasicPanel insight={insight} onClear={onClear} />
        )}
      </motion.div>
    </AnimatePresence>
  )

  return <Card className="flex h-full flex-col p-4">{body}</Card>
}
