import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { WindowStatus } from '../data/types'

/* ── Card / panel ────────────────────────────────────────────────────────── */
export function Card({
  children,
  className,
  as: As = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <As
      className={cn(
        'rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)]',
        // Depth from a hairline border + the faintest lift — never heavy shadow.
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className,
      )}
    >
      {children}
    </As>
  )
}

/* ── Section heading ─────────────────────────────────────────────────────── */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  right,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-3)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[18px] font-semibold leading-tight text-[var(--color-ink)]">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-[var(--color-ink-2)]">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/* ── Status chip (pipeline windows) ──────────────────────────────────────── */
const STATUS_STYLES: Record<WindowStatus, { label: string; cls: string; dot: string }> = {
  complete: {
    label: 'Complete',
    cls: 'text-[var(--color-ink-2)] bg-[var(--color-surface-2)] border-[var(--color-border)]',
    dot: 'bg-[var(--color-success)]',
  },
  active: {
    label: 'Active',
    cls: 'text-[var(--color-accent-strong)] bg-[var(--color-accent-soft)] border-[#d8dcf6]',
    dot: 'bg-[var(--color-accent)]',
  },
  upcoming: {
    label: 'Upcoming',
    cls: 'text-[var(--color-ink-3)] bg-transparent border-dashed border-[var(--color-border-strong)]',
    dot: 'bg-[var(--color-ink-3)]',
  },
}
// Iteration 2: a clearer three-tier system — green (done), solid-blue live
// (active, the standout, with a pulsing dot), muted grey (upcoming).
const REFINED_STYLES: Record<WindowStatus, { cls: string; dot: string; pulse?: boolean }> = {
  complete: {
    cls: 'text-[#15803d] bg-[#eaf7ef] border-[#cfe9d8]',
    dot: 'bg-[#16a34a]',
  },
  active: {
    cls: 'text-white bg-[var(--color-accent)] border-[var(--color-accent-strong)] font-semibold',
    dot: 'bg-white',
    pulse: true,
  },
  upcoming: {
    cls: 'text-[var(--color-ink-3)] bg-[var(--color-surface-2)] border-[var(--color-border)]',
    dot: 'bg-[#cbd5e1]',
  },
}

export function StatusChip({
  status,
  upcomingLabel,
  refined,
}: {
  status: WindowStatus
  upcomingLabel?: string // Iteration 1 uses "Not yet open"; default "Upcoming"
  refined?: boolean // Iteration 2: higher-contrast, colour-tiered treatment
}) {
  const s = STATUS_STYLES[status]
  const r = refined ? REFINED_STYLES[status] : null
  const label = status === 'upcoming' && upcomingLabel ? upcomingLabel : s.label
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        r ? r.cls : s.cls,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', r ? r.dot : s.dot, r?.pulse && 'animate-pulse')}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

/* ── Committed → realized dumbbell (threaded everywhere this distinction shows) ─ */
export function CommittedRealizedBar({
  committed,
  realized,
  className,
}: {
  committed: number
  realized: number
  className?: string
}) {
  const pct = committed > 0 ? Math.min(100, (realized / committed) * 100) : 0
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-committed)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-realized)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ── Legend swatch ───────────────────────────────────────────────────────── */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-2)]">
      <span className="h-2 w-2 rounded-[3px]" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  )
}
