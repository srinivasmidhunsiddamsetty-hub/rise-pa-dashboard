import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { SINCE_LAST_REVIEW } from '../data/program'

// "Since last review" digest (Iteration 2 only, PRD §12.4).
// A slim strip that pre-summarizes what moved since the last visit — it lowers
// cognitive load by answering "what changed?" before the eye reaches the tiles.
export function SinceLastReview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
    >
      <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-ink)]">
        <History size={14} className="text-[var(--color-accent)]" />
        {SINCE_LAST_REVIEW.sinceLabel}
      </span>
      <span className="hidden h-4 w-px bg-[var(--color-border)] sm:block" />
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
        {SINCE_LAST_REVIEW.items.map((it, i) => (
          <Fragment key={it.label}>
            {i > 0 && (
              <span className="h-3 w-px bg-[var(--color-border)]" aria-hidden="true" />
            )}
            <span className="inline-flex items-baseline gap-1.5 text-[13px]">
              <span className="tnum font-semibold text-[var(--color-accent-strong)]">{it.value}</span>
              <span className="text-[var(--color-ink-2)]">{it.label}</span>
            </span>
          </Fragment>
        ))}
      </div>
    </motion.div>
  )
}
