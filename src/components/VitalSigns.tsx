import type { ReactNode } from 'react'
import { Briefcase, Landmark, Leaf, Users, Wallet } from 'lucide-react'
import { KpiTile } from './KpiTile'
import { KpiSkeleton } from './states/Skeleton'
import { PROGRAM } from '../data/program'
import type { ScopedMetrics } from '../data/types'
import { fmtCompact, fmtInt, fmtMoneyShort, fmtPct } from '../lib/format'

// The five Vital Signs (PRD §5.4): Obligated · Disbursed · Projects Funded ·
// GHG Impact · Jobs. Minimal tiles — label, value, one line. Iteration 2 shows
// the REALIZED value with the realization rate; Iteration 1 shows committed.
function Accent({ children }: { children: ReactNode }) {
  return <span className="font-medium text-[var(--color-accent)]">{children}</span>
}

export function VitalSigns({
  metrics,
  iteration,
  loading,
}: {
  metrics: ScopedMetrics
  iteration: 1 | 2
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    )
  }

  const i2 = iteration === 2
  const ghgRate = metrics.ghgCommitted > 0 ? metrics.ghgRealized / metrics.ghgCommitted : 0
  const jobsRate = metrics.jobsCommitted > 0 ? metrics.jobsRealized / metrics.jobsCommitted : 0
  const disbVsOblig = metrics.obligated > 0 ? metrics.disbursed / metrics.obligated : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {/* 1 · Obligated */}
      <KpiTile
        index={0}
        refined={i2}
        icon={<Landmark size={24} strokeWidth={2.5} />}
        label="Obligated"
        value={fmtMoneyShort(metrics.obligated)}
        sub={
          <>
            <Accent>{fmtPct(metrics.poolShareObligated)}</Accent> of {fmtMoneyShort(PROGRAM.pool)} pool
          </>
        }
      />

      {/* 2 · Disbursed — realized against obligated */}
      <KpiTile
        index={1}
        refined={i2}
        icon={<Wallet size={24} strokeWidth={2.5} />}
        label="Disbursed"
        value={fmtMoneyShort(metrics.disbursed)}
        sub={
          i2 ? (
            <>
              <Accent>{fmtPct(disbVsOblig)} paid</Accent> of obligated
            </>
          ) : (
            <>{fmtPct(metrics.poolShareDisbursed)} of pool</>
          )
        }
      />

      {/* 3 · Projects Funded */}
      <KpiTile
        index={2}
        refined={i2}
        icon={<Users size={24} strokeWidth={2.5} />}
        label="Projects Funded"
        value={fmtInt(metrics.projectsFunded)}
        sub={<>from {fmtInt(metrics.applications)} applications</>}
      />

      {/* 4 · GHG Impact — committed → realized */}
      <KpiTile
        index={3}
        refined={i2}
        icon={<Leaf size={24} strokeWidth={2.5} />}
        label="GHG Impact"
        value={fmtCompact(i2 ? metrics.ghgRealized : metrics.ghgCommitted)}
        sub={
          i2 ? (
            <>
              <Accent>{fmtPct(ghgRate)} realized</Accent> of {fmtCompact(metrics.ghgCommitted)}
            </>
          ) : (
            <>tCO₂e/yr committed</>
          )
        }
      />

      {/* 5 · Jobs — committed → realized */}
      <KpiTile
        index={4}
        refined={i2}
        icon={<Briefcase size={24} strokeWidth={2.5} />}
        label="Jobs"
        value={fmtInt(i2 ? metrics.jobsRealized : metrics.jobsCommitted)}
        sub={
          i2 ? (
            <>
              <Accent>{fmtPct(jobsRate)} realized</Accent> of {fmtInt(metrics.jobsCommitted)}
            </>
          ) : (
            <>created / retained</>
          )
        }
      />
    </div>
  )
}
