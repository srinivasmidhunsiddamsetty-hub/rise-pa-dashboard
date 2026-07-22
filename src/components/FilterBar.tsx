import { AnimatePresence, motion } from 'framer-motion'
import { GRANT_YEARS, WINDOWS } from '../data/program'
import type { FilterScope } from '../lib/selectors'
import { cn } from '../lib/cn'

// Global filter (PRD §5.1 / §7.1). Three modes that re-compute EVERYTHING.
// Iteration 1 = basic (scope breadcrumb, "Individual trimester", light selected
// pills, "Year 1-4"). Iteration 2 = refined.
type Mode = 'all' | 'trimester' | 'year'

function modeOf(scope: FilterScope): Mode {
  return scope.mode
}

export function FilterBar({
  scope,
  iteration,
  onScope,
}: {
  scope: FilterScope
  iteration: 1 | 2
  onScope: (s: FilterScope) => void
}) {
  const mode = modeOf(scope)
  const refined = iteration === 2
  const selectableWindows = WINDOWS.filter((w) => w.status !== 'upcoming')

  const MODES: { key: Mode; label: string }[] = [
    { key: 'all', label: 'All trimesters' },
    { key: 'trimester', label: refined ? 'Trimester' : 'Individual trimester' },
    { key: 'year', label: 'Grant year' },
  ]

  function pickMode(m: Mode) {
    if (m === 'all') onScope({ mode: 'all' })
    else if (m === 'trimester') onScope({ mode: 'trimester', windowId: 'T2.2' })
    else onScope({ mode: 'year', year: 2 })
  }

  // Selected sub-pill styling: solid (refined) vs light wash (basic).
  const selectedPill = refined
    ? 'border-[var(--color-accent-strong)] bg-[var(--color-accent)] text-white'
    : 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'

  return (
    <div className="mx-auto max-w-[1320px] px-6">
      <div
        className={cn(
          'flex flex-col gap-3 py-3 lg:flex-row lg:items-center',
          !refined && 'lg:justify-between',
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode segmented control */}
          <div
            role="radiogroup"
            aria-label="Time scope"
            className="inline-flex items-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
          >
            {MODES.map((m) => {
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickMode(m.key)}
                  className={cn(
                    'rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
                  )}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Secondary picker, contextual to mode */}
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'trimester' && (
              <motion.div
                key="trimester-picker"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex flex-wrap items-center gap-1"
              >
                {WINDOWS.map((w) => {
                  const disabled = w.status === 'upcoming'
                  const active = scope.mode === 'trimester' && scope.windowId === w.id
                  return (
                    <button
                      key={w.id}
                      disabled={disabled}
                      onClick={() => onScope({ mode: 'trimester', windowId: w.id })}
                      title={disabled ? `${w.id} · Not yet open` : `${w.id} · ${w.period}`}
                      className={cn(
                        'tnum rounded-[7px] border px-2 py-1 text-[12px] font-medium transition-colors',
                        active
                          ? selectedPill
                          : disabled
                            ? 'cursor-not-allowed border-dashed border-[var(--color-border)] text-[var(--color-ink-3)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      {w.id}
                    </button>
                  )
                })}
                {!refined && (
                  <span className="ml-1 text-[11px] text-[var(--color-ink-3)]">
                    {selectableWindows.length} open · 5 upcoming
                  </span>
                )}
              </motion.div>
            )}

            {mode === 'year' && (
              <motion.div
                key="year-picker"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1"
              >
                {GRANT_YEARS.map((y) => {
                  const active = scope.mode === 'year' && scope.year === y.year
                  const hasData = y.windowIds.some(
                    (id) => WINDOWS.find((w) => w.id === id)?.status !== 'upcoming',
                  )
                  return (
                    <button
                      key={y.year}
                      onClick={() => onScope({ mode: 'year', year: y.year })}
                      disabled={!hasData}
                      title={`${y.label} · ${y.windowIds.join(' + ')}`}
                      className={cn(
                        'tnum rounded-[7px] border px-2.5 py-1 text-[12px] font-medium transition-colors',
                        active
                          ? selectedPill
                          : !hasData
                            ? 'cursor-not-allowed border-dashed border-[var(--color-border)] text-[var(--color-ink-3)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      {refined ? y.label : `Year ${y.year}`}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
