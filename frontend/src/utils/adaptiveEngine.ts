/**
 * Lightweight adaptive difficulty helpers for games and useAdaptiveEngine.
 */

export type AdaptivePayload = {
  accuracy: number
  avgResponseTime: number
  errors?: Record<string, unknown>
}

export type NextDifficultyResult = {
  next: number
  reason: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function getNextDifficulty(payload: AdaptivePayload): NextDifficultyResult {
  const { accuracy, avgResponseTime } = payload
  const errCount = payload.errors ? Object.keys(payload.errors).length : 0
  const fast = avgResponseTime < 5000
  const slow = avgResponseTime > 12000

  let next = 2
  let reason = 'Balanced performance; standard next step.'

  if (accuracy >= 85 && fast && errCount <= 1) {
    next = Math.min(5, 3 + Math.floor((accuracy - 85) / 5))
    reason = 'Strong accuracy and pace; increasing challenge.'
  } else if (accuracy >= 70 && !slow) {
    next = 2
    reason = 'Solid performance; slight increase.'
  } else if (accuracy < 45 || errCount > 4) {
    next = 1
    reason = 'More errors or low accuracy; easing difficulty.'
  } else if (slow && accuracy < 70) {
    next = 1
    reason = 'Slower responses; reducing difficulty.'
  }

  return { next: clamp(next, 1, 5), reason }
}

export function getNextLevel(currentLevel: number, accuracyPercent: number): number {
  if (accuracyPercent >= 80) return clamp(currentLevel + 1, 1, 10)
  if (accuracyPercent < 50) return clamp(currentLevel - 1, 1, 10)
  return currentLevel
}
