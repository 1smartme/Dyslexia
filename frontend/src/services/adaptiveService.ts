const API_BASE = 'http://localhost:5000/api'

export interface AdaptiveDifficulty {
  difficulty: 'beginner' | 'easy' | 'moderate' | 'hard'
  reason: string
}

export interface NextLevelRecommendation {
  nextLevel: 'beginner' | 'easy' | 'moderate' | 'hard'
  reason: string
  confidence: number
}

export interface GameSequence {
  sequence: string[]
  profile: {
    weakAreas: string[]
    dyslexiaIndicators: string[]
  }
}

export const getAdaptiveDifficulty = async (game: string): Promise<AdaptiveDifficulty> => {
  try {
    const response = await fetch(`${API_BASE}/adaptive/difficulty/${game}?user_id=mock-user`)
    if (!response.ok) return { difficulty: 'beginner', reason: 'Default level' }
    return await response.json()
  } catch (error) {
    console.error('Failed to get adaptive difficulty:', error)
    return { difficulty: 'beginner', reason: 'Error occurred' }
  }
}

export const getNextLevel = async (gameResult: {
  score: number
  timeTaken: number
  errors: any
  currentDifficulty: string
  game: string
}): Promise<NextLevelRecommendation> => {
  try {
    const response = await fetch(`${API_BASE}/adaptive/next-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameResult)
    })
    if (!response.ok) return { nextLevel: 'beginner', reason: 'Default', confidence: 0.5 }
    return await response.json()
  } catch (error) {
    console.error('Failed to get next level:', error)
    return { nextLevel: 'beginner', reason: 'Error occurred', confidence: 0.5 }
  }
}

export const getPersonalizedSequence = async (): Promise<GameSequence> => {
  try {
    const response = await fetch(`${API_BASE}/adaptive/sequence/mock-user`)
    if (!response.ok) return { sequence: [], profile: { weakAreas: [], dyslexiaIndicators: [] } }
    return await response.json()
  } catch (error) {
    console.error('Failed to get personalized sequence:', error)
    return { sequence: [], profile: { weakAreas: [], dyslexiaIndicators: [] } }
  }
}