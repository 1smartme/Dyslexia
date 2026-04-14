import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Brain, BarChart3, Loader, AlertCircle } from 'lucide-react'
import { sessionMetricsService } from '../../services/sessionMetricsService'

interface GameMetrics {
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  avgResponseTime: number
  gameName: string
  difficulty: string
}

interface EyeTrackingMetrics {
  totalFixations: number
  avgFixationDuration: number
  gazeStabilityScore: number
  focusLossEvents: number
}

interface MLPrediction {
  riskLevel: 'Low' | 'Medium' | 'High'
  confidenceScore: number
  indicators: string[]
  recommendations: string[]
}

interface SessionMetricsDisplayProps {
  userId: string
  gameSessionId?: string
  showRefresh?: boolean
}

const SessionMetricsDisplay: React.FC<SessionMetricsDisplayProps> = ({
  userId,
  gameSessionId,
  showRefresh = true
}) => {
  const [gameMetrics, setGameMetrics] = useState<GameMetrics | null>(null)
  const [eyeTracking, setEyeTracking] = useState<EyeTrackingMetrics | null>(null)
  const [mlPrediction, setMLPrediction] = useState<MLPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [gameData, eyeData, mlData] = await Promise.all([
        sessionMetricsService.fetchGameMetrics(userId, gameSessionId),
        sessionMetricsService.fetchEyeTrackingMetrics(userId, gameSessionId),
        sessionMetricsService.fetchMLPrediction(userId, gameSessionId)
      ])

      setGameMetrics(gameData)
      setEyeTracking(eyeData)
      setMLPrediction(mlData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      console.error('Error fetching session metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [userId, gameSessionId])

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getRiskLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return '✅'
      case 'medium':
        return '⚠️'
      case 'high':
        return '🚨'
      default:
        return '❓'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center h-96">
          <Loader className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading session metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-500 mr-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Unable to Load Metrics
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error}
                </p>
                {showRefresh && (
                  <button
                    onClick={fetchMetrics}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Session Metrics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete analysis of your game performance and eye tracking data
              </p>
            </div>
            {showRefresh && (
              <button
                onClick={fetchMetrics}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>

          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Game Metrics Card */}
          {gameMetrics && (
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Game Performance</h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Game Name & Difficulty */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Game</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gameMetrics.gameName}
                    </p>
                    <div className="inline-block">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {gameMetrics.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Accuracy
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {gameMetrics.accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${gameMetrics.accuracy}%` }}
                      />
                    </div>
                  </div>

                  {/* Correct/Incorrect */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Correct
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {gameMetrics.correctAnswers}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Incorrect
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {gameMetrics.incorrectAnswers}
                      </p>
                    </div>
                  </div>

                  {/* Total Questions */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Total Questions
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {gameMetrics.totalQuestions}
                    </p>
                  </div>

                  {/* Response Time */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Avg Response Time
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(gameMetrics.avgResponseTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Eye Tracking Metrics Card */}
          {eyeTracking && (
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Eye Tracking</h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Total Fixations */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Total Fixations
                    </p>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                      {eyeTracking.totalFixations}
                    </p>
                  </div>

                  {/* Avg Fixation Duration */}
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Avg Fixation Duration
                    </p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {eyeTracking.avgFixationDuration.toFixed(0)}ms
                    </p>
                  </div>

                  {/* Gaze Stability Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Gaze Stability Score
                      </p>
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {eyeTracking.gazeStabilityScore.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all"
                        style={{ width: `${eyeTracking.gazeStabilityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Focus Loss Events */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Focus Loss Events
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {eyeTracking.focusLossEvents}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ML Prediction Card */}
          {mlPrediction && (
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">ML Prediction</h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Risk Level */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Dyslexia Risk Level
                    </p>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-lg ${getRiskLevelColor(
                        mlPrediction.riskLevel
                      )}`}
                    >
                      <span>{getRiskLevelIcon(mlPrediction.riskLevel)}</span>
                      <span>{mlPrediction.riskLevel}</span>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Confidence Score
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {(mlPrediction.confidenceScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${mlPrediction.confidenceScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Indicators */}
                  {mlPrediction.indicators && mlPrediction.indicators.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Key Indicators
                      </p>
                      <div className="space-y-2">
                        {mlPrediction.indicators.slice(0, 3).map((indicator, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                              •
                            </span>
                            <span>{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {mlPrediction.recommendations && mlPrediction.recommendations.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                        💡 Recommendation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {mlPrediction.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Empty State */}
        {!gameMetrics && !eyeTracking && !mlPrediction && (
          <motion.div
            className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No metrics data available for this session.
            </p>
            {showRefresh && (
              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Loading Data
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SessionMetricsDisplay
