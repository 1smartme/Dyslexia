// frontend/src/services/scoreService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function persistDyslexiaSessionSummary(args: {
  userId: string
  gameType: string
  difficulty: string
  correct: number
  total: number
  readingSpeedWpm?: number
}) {
  const total = Math.max(1, Math.floor(args.total))
  const correct = Math.min(Math.max(0, Math.floor(args.correct)), total)
  const accuracy = correct / total
  const session_id = `${args.userId}-${args.gameType}-${Date.now()}`
  const body = {
    session_id,
    user_id: String(args.userId),
    game_type: args.gameType,
    difficulty: args.difficulty || 'medium',
    score: correct,
    total,
    accuracy,
    fixation_stats: { mean_duration: 200, count: 8 },
    regressions: { count: Math.min(total, Math.max(0, total - correct)) },
    reading_speed_wpm: Number(args.readingSpeedWpm) >= 0 ? Number(args.readingSpeedWpm) : 115,
    timestamp: new Date().toISOString(),
  }
  const res = await fetch(`${API_URL}/api/dyslexia/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    console.warn('persistDyslexiaSessionSummary:', res.status, t.slice(0, 200))
    return
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dyslexiaSessionUpdated'))
  }
}

export interface SaveScoreParams {
  userId: string
  gameName: string
  difficulty: string
  accuracy: number
  avgResponseTime: number
  errors: any
  score?: number
  /** When set, a summary row is written to Postgres (dyslexia_sessions) for profile / reports. */
  sessionSummary?: {
    gameType: string
    correct: number
    total: number
    readingSpeedWpm?: number
  }
}

/**
 * Fetch recent scores from backend
 * @param limit number of scores to fetch
 * @param userId optional user ID to filter scores
 */
export async function getRecentScores(limit = 30, userId?: string) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Not logged in: token missing')

    let url = `${API_URL}/api/scores?limit=${limit}`
    if (userId) url += `&userId=${userId}`

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error('Failed to fetch scores')

    const data = await res.json()
    return data
  } catch (err) {
    console.error('Error fetching scores:', err)
    return []
  }
}

/**
 * Save a game score to backend
 */
export async function saveGameScore(params: SaveScoreParams) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Not logged in: token missing')

    const res = await fetch(`${API_URL}/api/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        game_name: params.gameName,
        score: params.score !== undefined ? params.score : Math.round(params.accuracy * 100),
        difficulty: params.difficulty,
        avg_response_time: params.avgResponseTime,
        errors: params.errors || {},
      }),
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      throw new Error(errorBody.error || 'Failed to save score')
    }

    const saved = await res.json()
    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: saved }))

    const sum = params.sessionSummary
    if (sum && sum.total > 0) {
      try {
        await persistDyslexiaSessionSummary({
          userId: params.userId,
          gameType: sum.gameType,
          difficulty: params.difficulty,
          correct: sum.correct,
          total: sum.total,
          readingSpeedWpm: sum.readingSpeedWpm,
        })
      } catch (e) {
        console.warn('Session summary persist failed:', e)
      }
    }

    return saved
  } catch (err) {
    console.error('Error saving score:', err)
    return { error: err }
  }
}
