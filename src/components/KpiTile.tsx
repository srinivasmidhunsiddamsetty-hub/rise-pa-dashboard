import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

// A single Vital Sign tile (PRD §5.4 / §7.2). Iteration 1 = minimal stacked
// label/value/note. Iteration 2 = a leading icon medallion + larger value.
export interface KpiTileProps {
  label: string
  value: string
  sub?: ReactNode
  index?: number
  /** Iteration 2: larger value + darker label. */
  refined?: boolean
  /** Iteration 2: leading icon (rendered in a soft-blue medallion). */
  icon?: ReactNode
}

export function KpiTile({ label, value, sub, index = 0, refined = false, icon }: KpiTileProps) {
  const content = (
    <div className="flex min-w-0 flex-col">
      <span
        className={cn(
          'font-semibold uppercase tracking-[0.07em]',
          refined
            ? 'text-[10.5px] text-[var(--color-ink-2)]'
            : 'text-[11px] text-[var(--color-ink-3)]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'display-num mt-1.5 font-semibold leading-none text-[var(--color-ink)]',
          refined ? 'text-[33px]' : 'text-[30px]',
        )}
      >
        {value}
      </span>
      {sub && <div className="mt-2 text-[12px] text-[var(--color-ink-2)]">{sub}</div>}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-[22px]',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]',
      )}
    >
      {refined && icon ? (
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            {icon}
          </div>
          {content}
        </div>
      ) : (
        content
      )}
    </motion.div>
  )
}
