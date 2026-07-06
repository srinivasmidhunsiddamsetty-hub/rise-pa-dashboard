# RISE PA — Executive Dashboard

An executive monitoring & decision-support dashboard for **RISE PA**, PennTAP's ~$40M
EPA-funded industrial-decarbonization grant program. Built as a real, interactive React
application that ships **two iterations as two routes** for a before/after case study.

> Single source of truth: `RISE_PA_Dashboard_Build_Document.md` (the PRD). Where the
> reference screenshots conflicted with the PRD, the PRD won.

## Run

```bash
npm install
npm run dev      # → http://localhost:5173  ( / redirects to /iteration-1 )
npm run build    # production build
```

Routes:

- **`/iteration-1`** — the **monitoring layer**: "what is happening now." Current values
  only — no forecast, no deltas, no committed→realized depth.
- **`/iteration-2`** — the **decision-support layer**: the same dashboard, evolved. Adds
  forecast + at-risk-of-return, committed→realized treatment, since-last-trimester deltas,
  a "since last review" digest, timeline annotations, and deeper area insights — and
  nothing operational.

Use the **"View Iteration N →"** link in the header to flip between them for screenshots.

## The two tabs (both iterations)

- **Program Health** — header (logo left, tabs right) · global filter (All trimesters /
  Individual trimester / Grant year) that re-computes everything · five Vital Signs
  (Obligated, Disbursed, Projects Funded, GHG Impact, Jobs) · a **full-width Budget Runway
  + Forecast hero** · a context-aware Trimester Pipeline. No action queue.
- **Statewide Reach** — a Pennsylvania choropleth on the left (county ⇄ region toggle,
  hover-to-peek, click-to-lock, Funding/Projects/GHG shading) · a contextual Area Insights
  panel on the right (statewide totals ↔ selected-area metrics). No treemap.

Every control, chart, filter, tooltip, and map interaction is functional and reactive, with
loading (skeleton) / empty ("Not yet open" / "No awards yet") / hover / selected / filtered
states.

## Design direction

Calm, premium, observability-grade instrument with **very low cognitive load**: light-first,
depth from hairline borders (not heavy shadow), generous whitespace, strong hierarchy (the
runway is the clear hero), **one indigo accent (`#4338CA`)** that carries meaning, Inter with
tabular figures throughout, and restrained ≤300ms motion. Committed vs. realized is a single
visual grammar (solid indigo = realized, light indigo tint = committed) threaded everywhere,
never a separate panel.

## Tech

React 18 · Vite · TypeScript · Tailwind v4 (custom token theme in `src/index.css`) ·
Recharts (runway / forecast / pipeline) · react-simple-maps + d3-geo + d3-scale + a PA
counties GeoJSON (choropleth) · Radix primitives (tabs / tooltips) · framer-motion ·
lucide-react · `@fontsource/inter`.

## Architecture (`src/`)

```
main.tsx                 router: / → /iteration-1 · /iteration-1 · /iteration-2
data/
  program.ts             the single shared dataset (PRD §6) — used by BOTH iterations
  regions.ts             DEP region totals + region→county mapping + per-county generator
  pa-counties.json       Pennsylvania counties GeoJSON (filtered from us-atlas, FIPS 42)
  types.ts               shared data types
lib/
  format.ts              tabular currency / number / percent formatters
  selectors.ts           pure filter-scope + area-aggregation logic
components/              shared, reused by BOTH iterations
  Header · FilterBar · VitalSigns · KpiTile
  BudgetRunway           forecast band + Dollars/GHG/Jobs toggle gated by `iteration`
  TrimesterPipeline      overview bars vs single-window funnel
  PaMap · AreaInsights · SinceLastReview (I2 only) · ui · states/{Skeleton,EmptyState}
  Dashboard              shared shell; Iteration 2 = same code with `iteration={2}`
pages/Iteration1.tsx · pages/Iteration2.tsx
```

**One shared dataset + one shared component library; Iteration 2 is the same code with extra
capability enabled** via the `iteration` prop plus a few I2-only components. The before/after
is honest — same data, evolved design. All scope/aggregation lives in pure functions in
`lib/selectors.ts`, so components stay declarative and the filter re-computes predictably.

## Sample data note

The dataset is the realistic mid-program figures baked into PRD §6 — program totals, the 10
trimester windows, the cumulative deployment series, DEP region totals + region→county
mapping, and industry composition. Per-county funding/projects/GHG are generated to sum
*exactly* to each region total, weighted toward manufacturing centers; 38 of 67 counties have
awards, the rest render as an explicit "no awards yet" state. It is a high-fidelity prototype,
not connected to a live PennTAP system.
