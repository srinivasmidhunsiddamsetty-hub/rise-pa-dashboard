import { useEffect, useRef, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import { Header, type TabKey } from './Header'
import { FilterBar } from './FilterBar'
import { VitalSigns } from './VitalSigns'
import { BudgetRunway } from './BudgetRunway'
import { TrimesterPipeline } from './TrimesterPipeline'
import { SinceLastReview } from './SinceLastReview'
import { PaMap } from './PaMap'
import { AreaInsights } from './AreaInsights'
import type { AreaLevel, AreaSelection, FilterScope } from '../lib/selectors'
import { areaInsight, computeMetrics, scopeFactor } from '../lib/selectors'

/**
 * Shared dashboard shell used by BOTH iterations (PRD §14 — one component
 * library; Iteration 2 is the same code with extra capability enabled via the
 * `iteration` prop). Holds the cross-tab state (filter scope persists across tab
 * switches) and simulates the loading state on mount + filter change.
 */
export function Dashboard({ iteration }: { iteration: 1 | 2 }) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [scope, setScope] = useState<FilterScope>({ mode: 'all' })
  const [mapLevel, setMapLevel] = useState<AreaLevel>('county')
  const [selection, setSelection] = useState<AreaSelection>(null)
  const [loading, setLoading] = useState(true)
  const firstRun = useRef(true)

  // Skeletons on first paint and on every filter change (~450ms — PRD §7.5).
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), firstRun.current ? 520 : 420)
    firstRun.current = false
    return () => clearTimeout(t)
  }, [scope])

  const metrics = computeMetrics(scope)
  const factor = scopeFactor(scope)
  const insight = areaInsight(selection, factor)

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(v) => setTab(v as TabKey)}
      // Iteration 2 wears the refined theme (Geist + faint blue tint); I1 stays basic.
      className={`min-h-screen${iteration === 2 ? ' theme-refined' : ''}`}
    >
      <Header iteration={iteration} />
      <div className="border-b border-[var(--color-border)] bg-[var(--color-canvas)]">
        <FilterBar scope={scope} iteration={iteration} onScope={setScope} />
      </div>

      <main className="mx-auto max-w-[1320px] px-6 py-5">
        {/* ── Tab 1 · Overview ───────────────────────────────────────────── */}
        <Tabs.Content value="overview" className="focus-visible:outline-none">
          <div className="space-y-5">
            {/* Iteration 2 only: a slim "since last review" digest (§12.4) */}
            {iteration === 2 && <SinceLastReview />}

            <VitalSigns metrics={metrics} iteration={iteration} loading={loading} />

            {/* Full-width hero (PRD §5.2) */}
            <BudgetRunway scope={scope} iteration={iteration} loading={loading} />

            {/* Pipeline below the runway, context-aware to the filter */}
            <TrimesterPipeline scope={scope} iteration={iteration} loading={loading} />
          </div>
        </Tabs.Content>

        {/* ── Tab 2 · Statewide Reach ────────────────────────────────────── */}
        <Tabs.Content value="reach" className="focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.5fr_1fr]"
          >
            <PaMap
              level={mapLevel}
              onLevel={setMapLevel}
              selection={selection}
              onSelect={setSelection}
              loading={loading}
              iteration={iteration}
            />
            <AreaInsights
              insight={insight}
              iteration={iteration}
              loading={loading}
              scoped={scope.mode !== 'all'}
              onClear={() => setSelection(null)}
            />
          </motion.div>
        </Tabs.Content>
      </main>

    </Tabs.Root>
  )
}
