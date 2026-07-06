import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '../lib/cn'

// Global shell header (PRD §5.1): logo/wordmark LEFT, navigation tabs RIGHT.
// Iteration 1 is the basic build (pill tabs, "Program Health", subtitle + badge).
// Iteration 2 is the refined chrome (underline tabs, "Overview", name only).
export type TabKey = 'overview' | 'reach'

const TAB_LABELS: Record<1 | 2, { key: TabKey; label: string }[]> = {
  1: [
    { key: 'overview', label: 'Program Health' },
    { key: 'reach', label: 'Statewide Reach' },
  ],
  2: [
    { key: 'overview', label: 'Overview' },
    { key: 'reach', label: 'Statewide Reach' },
  ],
}

/** The RISE PA brand mark — a blue tile with an ascending deployment line. */
function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="var(--color-accent)" />
      <path
        d="M7 23.5 L13 18 L18.5 20.5 L27 10.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="10.5" r="2.1" fill="white" />
    </svg>
  )
}

export function Header({ iteration }: { iteration: 1 | 2 }) {
  const refined = iteration === 2

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-canvas)_84%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6">
        {/* Brand — left */}
        <div className="flex items-center gap-2.5">
          <BrandMark />
          {refined ? (
            <span className="text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
              RISE PA
            </span>
          ) : (
            <div className="leading-none">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
                  RISE PA
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-3)]">
                  Iteration 1
                </span>
              </div>
              <span className="mt-1 block text-[11px] text-[var(--color-ink-3)]">
                Executive dashboard · PennTAP
              </span>
            </div>
          )}
        </div>

        {/* Tabs + iteration switch — right */}
        <div className={cn('flex items-center', refined ? 'gap-7' : 'gap-4')}>
          {refined ? (
            <Tabs.List className="flex h-16 items-stretch gap-7" aria-label="Sections">
              {TAB_LABELS[2].map((t) => (
                <Tabs.Trigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    'relative inline-flex items-center text-[14px] font-medium text-[var(--color-ink-2)] transition-colors',
                    'hover:text-[var(--color-ink)]',
                    'data-[state=active]:text-[var(--color-accent)] data-[state=active]:font-semibold',
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:rounded-t after:bg-[var(--color-accent)] after:opacity-0 after:content-['']",
                    'data-[state=active]:after:opacity-100',
                  )}
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          ) : (
            <Tabs.List
              className="flex items-center gap-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
              aria-label="Sections"
            >
              {TAB_LABELS[1].map((t) => (
                <Tabs.Trigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    'rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors',
                    'hover:text-[var(--color-ink)]',
                    'data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-white',
                  )}
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          )}
        </div>
      </div>
    </header>
  )
}
