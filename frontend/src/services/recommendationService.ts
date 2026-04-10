const API_BASE = 'http://localhost:5000/api'

export async function getRecommendations(limit = 10, userId?: string) {
  try {
    if (!userId) return []
    
    const response = await fetch(`${API_BASE}/recommendations?limit=${limit}&user_id=${userId}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return []
  }
}

export async function saveRecommendation(recommendation: {
  gameName: string;
  recommendedDifficulty: string;
  reason: string;
}) {
  try {
    const response = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_name: recommendation.gameName,
        recommended_difficulty: recommendation.recommendedDifficulty,
        reason: recommendation.reason
      })
    })
    if (!response.ok) throw new Error('Failed to save recommendation')
    return await response.json()
  } catch (error) {
    console.error('Failed to save recommendation:', error)
    throw error
  }
}