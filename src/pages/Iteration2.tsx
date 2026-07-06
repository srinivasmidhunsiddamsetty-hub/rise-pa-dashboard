import { Dashboard } from '../components/Dashboard'

// Iteration 2 — the DECISION-SUPPORT layer (PRD §12): the same dashboard,
// evolved. Adds forecast + at-risk-of-return, committed→realized treatment,
// deltas/targets, the since-last-review digest, timeline annotations, and deeper
// area insights — and deliberately NOTHING operational (no action queue).
export default function Iteration2() {
  return <Dashboard iteration={2} />
}
