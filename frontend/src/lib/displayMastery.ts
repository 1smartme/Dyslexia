/**
 * Maps raw task accuracy (0–1) to a learner-facing "mastery" percent that does not
 * sit at a flat 100% when performance is strong (avoids a fake "perfect" readout).
 */
export function masteryPercentFromRaw(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0
  const r = Math.min(1, Math.max(0, raw))
  const curved = 58 + 27 * Math.pow(r, 1.05)
  return Math.min(94, Math.max(12, Math.round(curved)))
}

export function masteryPercentFromScore(score: number, total: number): number {
  if (!total || !Number.isFinite(score)) return 0
  return masteryPercentFromRaw(score / total)
}
