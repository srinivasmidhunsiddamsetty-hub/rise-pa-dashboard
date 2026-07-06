import { cn } from '../../lib/cn'

// Skeleton shimmer placeholders (PRD §7.5 — skeletons, never spinners).
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden="true" />
}

/** A KPI-tile-shaped skeleton. */
export function KpiSkeleton() {
  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-3 h-2 w-full" />
    </div>
  )
}

/** A chart-area skeleton. */
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }} aria-hidden="true">
      {[42, 58, 51, 70, 64, 80, 73, 88, 79, 95].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
