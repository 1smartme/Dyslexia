import { useState, useCallback } from 'react'
import { sessionMetricsService } from '../services/sessionMetricsService'

interface SessionMetricsState {
  gameMetrics: any | null
  eyeTracking: any | null
  mlPrediction: any | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export const useSessionMetrics = (userId: string, gameSessionId?: string) => {
  const [state, setState] = useState<SessionMetricsState>({
    gameMetrics: null,
    eyeTracking: null,
    mlPrediction: null,
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchMetrics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const [gameData, eyeData, mlData] = await Promise.all([
        sessionMetricsService.fetchGameMetrics(userId, gameSessionId),
        sessionMetricsService.fetchEyeTrackingMetrics(userId, gameSessionId),
        sessionMetricsService.fetchMLPrediction(userId, gameSessionId)
      ])

      setState(prev => ({
        ...prev,
        gameMetrics: gameData,
        eyeTracking: eyeData,
        mlPrediction: mlData,
        loading: false,
        lastUpdated: new Date()
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch metrics'
      }))
    }
  }, [userId, gameSessionId])

  const refresh = useCallback(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    ...state,
    fetchMetrics,
    refresh
  }
}
