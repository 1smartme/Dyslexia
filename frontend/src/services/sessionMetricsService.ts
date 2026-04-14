/**
 * Session Metrics Service
 * Handles fetching game performance, eye tracking, and ML prediction data from backend APIs
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface GameMetricsResponse {
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  avgResponseTime: number
  gameName: string
  difficulty: string
}

export interface EyeTrackingMetricsResponse {
  totalFixations: number
  avgFixationDuration: number
  gazeStabilityScore: number
  focusLossEvents: number
}

export interface MLPredictionResponse {
  riskLevel: 'Low' | 'Medium' | 'High'
  confidenceScore: number
  indicators: string[]
  recommendations: string[]
}

export const sessionMetricsService = {
  /**
   * Fetch game performance metrics for a user
   */
  async fetchGameMetrics(
    userId: string,
    gameSessionId?: string
  ): Promise<GameMetricsResponse> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Not authenticated')

      let url = `${API_URL}/api/game/user-results?userId=${userId}`
      if (gameSessionId) {
        url += `&sessionId=${gameSessionId}`
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            accuracy: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            avgResponseTime: 0,
            gameName: 'No data',
            difficulty: 'N/A'
          }
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch game metrics`)
      }

      const data = await response.json()

      return {
        accuracy: data.accuracy ?? 0,
        totalQuestions: data.totalQuestions ?? data.total_questions ?? 0,
        correctAnswers: data.correctAnswers ?? data.correct_answers ?? 0,
        incorrectAnswers: data.incorrectAnswers ?? data.incorrect_answers ?? 0,
        avgResponseTime: data.avgResponseTime ?? data.avg_response_time ?? 0,
        gameName: data.gameName ?? data.game_name ?? 'Unknown Game',
        difficulty: data.difficulty ?? 'Normal'
      }
    } catch (error) {
      console.error('Error fetching game metrics:', error)
      throw new Error(
        `Failed to load game metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  /**
   * Fetch eye tracking metrics for a user session
   */
  async fetchEyeTrackingMetrics(
    userId: string,
    gameSessionId?: string
  ): Promise<EyeTrackingMetricsResponse> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Not authenticated')

      let url = `${API_URL}/api/eye-tracking/session?userId=${userId}`
      if (gameSessionId) {
        url += `&sessionId=${gameSessionId}`
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            totalFixations: 0,
            avgFixationDuration: 0,
            gazeStabilityScore: 0,
            focusLossEvents: 0
          }
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch eye tracking metrics`)
      }

      const data = await response.json()

      return {
        totalFixations: data.totalFixations ?? data.total_fixations ?? 0,
        avgFixationDuration: data.avgFixationDuration ?? data.avg_fixation_duration ?? 0,
        gazeStabilityScore: data.gazeStabilityScore ?? data.gaze_stability_score ?? 0,
        focusLossEvents: data.focusLossEvents ?? data.focus_loss_events ?? 0
      }
    } catch (error) {
      console.error('Error fetching eye tracking metrics:', error)
      throw new Error(
        `Failed to load eye tracking metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  /**
   * Fetch ML prediction results for a user
   */
  async fetchMLPrediction(
    userId: string,
    gameSessionId?: string
  ): Promise<MLPredictionResponse> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Not authenticated')

      let url = `${API_URL}/api/prediction/latest?userId=${userId}`
      if (gameSessionId) {
        url += `&sessionId=${gameSessionId}`
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            riskLevel: 'Low',
            confidenceScore: 0,
            indicators: [],
            recommendations: ['Complete more game sessions for assessment.']
          }
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch ML prediction`)
      }

      const data = await response.json()

      // Normalize risk level
      const riskLevel = normalizeRiskLevel(data.riskLevel ?? data.risk_level ?? 'Low')

      return {
        riskLevel,
        confidenceScore: normalizeScore(data.confidenceScore ?? data.confidence_score ?? 0),
        indicators: Array.isArray(data.indicators ?? data.indicator)
          ? (data.indicators ?? data.indicator)
          : [],
        recommendations: Array.isArray(data.recommendations ?? data.recommendation)
          ? (data.recommendations ?? data.recommendation)
          : ['No specific recommendations at this time.']
      }
    } catch (error) {
      console.error('Error fetching ML prediction:', error)
      throw new Error(
        `Failed to load ML prediction: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  /**
   * Fetch all session metrics at once
   */
  async fetchAllMetrics(userId: string, gameSessionId?: string) {
    try {
      const [gameMetrics, eyeTracking, mlPrediction] = await Promise.all([
        this.fetchGameMetrics(userId, gameSessionId),
        this.fetchEyeTrackingMetrics(userId, gameSessionId),
        this.fetchMLPrediction(userId, gameSessionId)
      ])

      return { gameMetrics, eyeTracking, mlPrediction }
    } catch (error) {
      console.error('Error fetching all metrics:', error)
      throw error
    }
  }
}

/**
 * Normalize risk level to standard format
 */
function normalizeRiskLevel(level: any): 'Low' | 'Medium' | 'High' {
  const normalized = String(level).toLowerCase()
  if (normalized.includes('high') || normalized.includes('severe')) return 'High'
  if (normalized.includes('medium') || normalized.includes('moderate')) return 'Medium'
  return 'Low'
}

/**
 * Normalize score to 0-1 range
 */
function normalizeScore(score: number): number {
  if (score > 1) {
    // Assume it's 0-100
    return Math.round(score) / 100
  }
  return Math.max(0, Math.min(1, score))
}
