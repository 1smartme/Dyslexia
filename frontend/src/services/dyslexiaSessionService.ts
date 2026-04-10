const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

export type DyslexiaSessionError = { expected: string; actual: string } | Record<string, unknown>
export type FixationStats = Record<string, unknown> & { mean_duration?: number; count?: number }
export type Regressions = Record<string, unknown> & { count?: number }

export interface SendDyslexiaSessionDataArgs {
  session_id?: string
  user_id: string
  game_type: string
  difficulty: string
  score: number
  total: number
  errors: DyslexiaSessionError[]
  gaze_stream: unknown[]
  fixation_stats: FixationStats
  regressions: Regressions
  reading_speed_wpm: number
  timestamp?: string
}

export async function sendDyslexiaSessionData(args: SendDyslexiaSessionDataArgs) {
  const total = Number(args.total)
  const score = Number(args.score)

  if (!Array.isArray(args.gaze_stream) || args.gaze_stream.length === 0) {
    throw new Error('Invalid session data: gaze_stream must not be empty')
  }
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Invalid session data: total must be > 0')
  }
  if (!Number.isFinite(score) || score < 0) {
    throw new Error('Invalid session data: score must be a non-negative number')
  }

  const accuracy = score / total
  const session_id = args.session_id || `${args.user_id}-${args.game_type}-${Date.now()}`

  const payload = {
    session_id,
    user_id: args.user_id,
    game_type: args.game_type,
    difficulty: args.difficulty,
    score,
    total,
    accuracy,
    errors: args.errors ?? [],
    gaze_stream: args.gaze_stream,
    fixation_stats: args.fixation_stats ?? {},
    regressions: args.regressions ?? {},
    reading_speed_wpm: Number(args.reading_speed_wpm) || 0,
    timestamp: args.timestamp || new Date().toISOString(),
  }

  console.log('[dyslexia] payload before sending', payload)

  const res = await fetch(`${API_BASE}/dyslexia/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const details = await res.text().catch(() => '')
    throw new Error(`sendDyslexiaSessionData failed: ${res.status} ${details}`)
  }

  return res.json()
}

