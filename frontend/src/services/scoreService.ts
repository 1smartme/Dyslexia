// frontend/src/services/scoreService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface SaveScoreParams {
  userId: string
  gameName: string
  difficulty: string
  accuracy: number
  avgResponseTime: number
  errors: any
  score?: number
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
    return saved
  } catch (err) {
    console.error('Error saving score:', err)
    return { error: err }
  }
}
