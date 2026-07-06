import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

// Calm, explicit empty state (PRD §7.5) — "Not yet open" / "No awards yet".
// Never blank or zero-styled as if broken.
export function EmptyState({
  icon,
  title,
  hint,
  className,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="mb-2 text-[var(--color-ink-3)]">{icon}</div>}
      <p className="text-sm font-medium text-[var(--color-ink-2)]">{title}</p>
      {hint && <p className="mt-1 max-w-[28ch] text-xs text-[var(--color-ink-3)]">{hint}</p>}
    </div>
  )
}
