import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'
import { Card, LegendDot, SectionHeading, StatusChip } from './ui'
import { Skeleton } from './states/Skeleton'
import { EmptyState } from './states/EmptyState'
import { WINDOWS } from '../data/program'
import type { TrimesterWindow } from '../data/types'
import type { FilterScope } from '../lib/selectors'
import { aggregateFunnel, pipelineMode } from '../lib/selectors'
import { fmtInt, fmtPct } from '../lib/format'
import { cn } from '../lib/cn'

// Trimester Pipeline (PRD §7.3). Context-aware to the global filter.
// Iteration 1 = the basic overview (a single volume bar + status chip per row).
// Iteration 2 = the refined table (columns, height-differentiated bars, hover).

const MAX_APPS = Math.max(...WINDOWS.map((w) => w.applications ?? 0)) // 52 (T2.1)

/* ── Iteration 1 (basic) outcome colors ──────────────────────────────────── */
const BASIC_SEG = {
  awarded: 'var(--color-realized)',
  underReview: 'var(--color-accent-mid)',
  deniedWithdrawn: '#cbd5e1',
}

/* ── Iteration 2 (refined) outcome colors, height-differentiated ──────────── */
const SEG = {
  awarded: { color: 'var(--color-realized)', h: 17, legendH: 10, label: 'Funded' },
  underReview: { color: '#5ea0e6', h: 15, legendH: 8, label: 'Under review' },
  deniedWithdrawn: { color: '#cbd5e1', h: 11, legendH: 6, label: 'Denied / withdrawn' },
}

const COLS = 'grid grid-cols-[56px_140px_minmax(180px,1fr)_120px_120px] items-center gap-4'

/* ══ Iteration 1 · basic overview ═════════════════════════════════════════ */
function BasicSeg({ value, total, color }: { value: number; total: number; color: string }) {
  if (value <= 0) return null
  return (
    <div
      style={{ width: `${(value / total) * 100}%`, background: color }}
      className="h-full border-r border-white/70 last:border-r-0"
    />
  )
}

function BasicRow({ w, index }: { w: TrimesterWindow; index: number }) {
  const isUpcoming = w.status === 'upcoming'
  const isActive = w.status === 'active'
  const widthPct = isUpcoming ? 0 : ((w.applications ?? 0) / MAX_APPS) * 100
  const f = w.funnel
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.025 }}
      className={cn(
        'grid grid-cols-[112px_1fr_auto] items-center gap-4 rounded-[10px] px-3 py-2.5',
        isActive ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-surface-2)]',
      )}
    >
      <div className="min-w-0">
        <span className="tnum text-[13px] font-semibold text-[var(--color-ink)]">{w.id}</span>
        <span className="block text-[11px] text-[var(--color-ink-3)]">{w.period}</span>
      </div>

      <div className="flex items-center gap-3">
        {isUpcoming || !f ? (
          <div className="flex h-7 flex-1 items-center rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-2 text-[11px] text-[var(--color-ink-3)]">
            Not yet open
          </div>
        ) : (
          <div className="h-7 flex-1">
            <div
              className="flex h-full items-stretch overflow-hidden rounded-[6px]"
              style={{ width: `${Math.max(widthPct, 8)}%` }}
              role="img"
              aria-label={`${w.applications} applications: ${f.awarded} awarded, ${f.underReview} under review, ${f.deniedWithdrawn} denied or withdrawn`}
            >
              <BasicSeg value={f.awarded} total={w.applications ?? 1} color={BASIC_SEG.awarded} />
              <BasicSeg value={f.underReview} total={w.applications ?? 1} color={BASIC_SEG.underReview} />
              <BasicSeg value={f.deniedWithdrawn} total={w.applications ?? 1} color={BASIC_SEG.deniedWithdrawn} />
            </div>
          </div>
        )}
        <span className="tnum w-16 shrink-0 text-right text-[12px] text-[var(--color-ink-2)]">
          {isUpcoming ? '—' : `${w.applications} apps`}
        </span>
      </div>

      <StatusChip status={w.status} upcomingLabel="Not yet open" />
    </motion.div>
  )
}

/* ══ Iteration 2 · refined table ══════════════════════════════════════════ */
function VolumeBar({ w }: { w: TrimesterWindow }) {
  const f = w.funnel
  const apps = w.applications ?? 0
  if (!f || apps === 0) return null
  const shown = f.awarded + f.underReview + f.deniedWithdrawn
  const barWidth = (apps / MAX_APPS) * 100
  const segs = [
    { key: 'awarded', value: f.awarded, ...SEG.awarded },
    { key: 'underReview', value: f.underReview, ...SEG.underReview },
    { key: 'deniedWithdrawn', value: f.deniedWithdrawn, ...SEG.deniedWithdrawn },
  ].filter((s) => s.value > 0)
  return (
    <div className="flex h-6 items-center" style={{ width: `${Math.max(barWidth, 10)}%` }}>
      {segs.map((s, i) => (
        <span
          key={s.key}
          style={{ width: `${(s.value / shown) * 100}%`, height: s.h, background: s.color }}
          className={cn(i === 0 && 'rounded-l-[3px]', i === segs.length - 1 && 'rounded-r-[3px]')}
        />
      ))}
    </div>
  )
}

function BreakdownRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="flex items-center gap-1.5 text-[var(--color-ink-2)]">
        <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
        {label}
      </span>
      <span className="tnum font-medium text-[var(--color-ink)]">{fmtInt(value)}</span>
    </div>
  )
}

function TableRow({ w, index }: { w: TrimesterWindow; index: number }) {
  const isUpcoming = w.status === 'upcoming'
  const isActive = w.status === 'active'
  const f = w.funnel
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: index * 0.022 }}
      className={cn(
        COLS,
        '-mx-2 rounded-[8px] px-2 py-2',
        isActive ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-surface-2)]',
      )}
    >
      <span className="tnum text-[13px] font-semibold text-[var(--color-ink)]">{w.id}</span>
      <span className="text-[12.5px] text-[var(--color-ink-2)]">{w.period}</span>

      <div className="flex items-center">
        {isUpcoming || !f ? (
          <span className="text-[12.5px] text-[var(--color-ink-3)]">Not yet open</span>
        ) : (
          <Tooltip.Root delayDuration={80}>
            <Tooltip.Trigger asChild>
              <button
                className="flex w-full items-center rounded-[4px] focus-visible:outline-none"
                aria-label={`${w.applications} applications: ${f.awarded} funded, ${f.underReview} under review, ${f.deniedWithdrawn} denied or withdrawn`}
              >
                <VolumeBar w={w} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                align="start"
                sideOffset={8}
                className="z-50 w-[208px] rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
              >
                <p className="mb-1.5 font-semibold text-[var(--color-ink)]">
                  {w.id} · {fmtInt(w.applications ?? 0)} applications
                </p>
                <div className="space-y-1">
                  <BreakdownRow color={SEG.awarded.color} label="Funded" value={f.awarded} />
                  {f.underReview > 0 && (
                    <BreakdownRow color={SEG.underReview.color} label="Under review" value={f.underReview} />
                  )}
                  <BreakdownRow color={SEG.deniedWithdrawn.color} label="Denied / withdrawn" value={f.deniedWithdrawn} />
                </div>
                <Tooltip.Arrow className="fill-[var(--color-surface)]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>

      <span className="tnum text-[13px] text-[var(--color-ink)]">
        {isUpcoming ? <span className="text-[var(--color-ink-3)]">—</span> : fmtInt(w.applications ?? 0)}
      </span>

      <span>
        <StatusChip status={w.status} refined />
      </span>
    </motion.div>
  )
}

function LegendItem({ color, h, label }: { color: string; h: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-2)]">
      <span className="flex h-3.5 w-3.5 items-center justify-center">
        <span className="w-3.5 rounded-[2px]" style={{ height: h, background: color }} />
      </span>
      {label}
    </span>
  )
}

/* ══ Funnel (single window / grant year) — shared ═════════════════════════ */
function FunnelView({ scope }: { scope: FilterScope }) {
  const { stages } = aggregateFunnel(scope)
  const received = stages.find((s) => s.key === 'received')?.value ?? 0
  if (received === 0) {
    return (
      <EmptyState
        title="No applications in this scope yet"
        hint="This window has not opened. Pick a completed or active trimester to see its review funnel."
      />
    )
  }
  const flow = stages.filter((s) => s.kind === 'flow')

  return (
    <div>
      <div className="space-y-2.5">
        {flow.map((s, i) => {
          const pct = received > 0 ? (s.value / received) * 100 : 0
          const conv = i === 0 ? 100 : received > 0 ? (s.value / received) * 100 : 0
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="w-36 shrink-0 text-[13px] text-[var(--color-ink-2)]">{s.label}</span>
              <div className="relative h-9 flex-1 overflow-hidden rounded-[7px] bg-[var(--color-surface-2)] ring-1 ring-inset ring-[var(--color-border)]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-[7px]"
                  style={{
                    background: s.key === 'awarded' ? 'var(--color-realized)' : 'var(--color-committed)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 3)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-semibold text-[var(--color-ink)]">
                  {fmtInt(s.value)}
                </span>
              </div>
              <span className="tnum w-12 shrink-0 text-right text-[12px] text-[var(--color-ink-3)]">
                {fmtPct(conv / 100)}
              </span>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}

/* ══ Container ════════════════════════════════════════════════════════════ */
export function TrimesterPipeline({
  scope,
  iteration,
  loading,
}: {
  scope: FilterScope
  iteration: 1 | 2
  loading: boolean
}) {
  const mode = pipelineMode(scope)
  const refined = iteration === 2

  return (
    <Tooltip.Provider>
      <Card className="p-5">
        <SectionHeading
          eyebrow="Throughput"
          title="Trimester Pipeline"
          subtitle={
            !refined && mode === 'overview'
              ? 'Application volume and outcomes across all 10 award windows.'
              : undefined
          }
          right={
            mode === 'overview' ? (
              refined ? (
                <div className="flex flex-wrap items-center gap-3.5">
                  <LegendItem color={SEG.awarded.color} h={SEG.awarded.legendH} label={SEG.awarded.label} />
                  <LegendItem color={SEG.underReview.color} h={SEG.underReview.legendH} label={SEG.underReview.label} />
                  <LegendItem color={SEG.deniedWithdrawn.color} h={SEG.deniedWithdrawn.legendH} label={SEG.deniedWithdrawn.label} />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <LegendDot color={BASIC_SEG.awarded} label="Awarded" />
                  <LegendDot color={BASIC_SEG.underReview} label="Under review" />
                  <LegendDot color={BASIC_SEG.deniedWithdrawn} label="Denied or withdrawn" />
                </div>
              )
            ) : undefined
          }
        />

        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : mode === 'funnel' ? (
            <FunnelView scope={scope} />
          ) : refined ? (
            <div>
              <div className={cn(COLS, 'border-b border-[var(--color-border)] pb-2')}>
                {['Window', 'Period', 'Volume', 'Applications', 'Status'].map((h) => (
                  <span
                    key={h}
                    className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-ink-3)]"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-1 space-y-0.5">
                {WINDOWS.map((w, i) => (
                  <TableRow key={w.id} w={w} index={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {WINDOWS.map((w, i) => (
                <BasicRow key={w.id} w={w} index={i} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </Tooltip.Provider>
  )
}
