// Tabular-friendly formatters. All numerics render with tabular figures (see index.css).

/** $24.5M, $900k, $2.6M — compact currency for KPIs and tooltips. */
export function fmtMoneyShort(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) {
    const m = v / 1_000_000
    // one decimal unless it's a whole number of millions
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (abs >= 1_000) return `$${Math.round(v / 1_000)}k`
  return `$${v}`
}

/** Full currency: $24,500,000 */
export function fmtMoneyFull(v: number): string {
  return `$${v.toLocaleString('en-US')}`
}

/** $M value already expressed in millions → "$24.5M". */
export function fmtM(v: number): string {
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`
}

/** 138,000 → "138k"; 1,200,000 → "1.2M". For GHG etc. */
export function fmtCompact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) {
    const k = v / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `${v}`
}

export function fmtInt(v: number): string {
  return v.toLocaleString('en-US')
}

/** 0.61 → "61%" */
export function fmtPct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}

/** Signed delta with a leading +/−, money. */
export function fmtDeltaMoney(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${fmtMoneyShort(Math.abs(v))}`
}

export function fmtDeltaCompact(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${fmtCompact(Math.abs(v))}`
}

export function fmtDeltaInt(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${Math.abs(v).toLocaleString('en-US')}`
}
