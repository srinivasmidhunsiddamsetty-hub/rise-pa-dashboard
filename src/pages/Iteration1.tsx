import { Dashboard } from '../components/Dashboard'

// Iteration 1 — the MONITORING layer (PRD §11): answers "what is happening now."
// Current values only — no forecast, no deltas, no committed→realized depth.
export default function Iteration1() {
  return <Dashboard iteration={1} />
}
