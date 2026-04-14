import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Brain, BarChart3, TrendingUp, Loader } from 'lucide-react'
import { useSessionMetrics } from '../../hooks/useSessionMetrics'

interface SessionMetricsCardProps {
  userId: string
  gameSessionId?: string
  compact?: boolean
  onClick?: () => void
}

/**
 * Compact Session Metrics Summary Card
 * Shows a quick overview of game performance, eye tracking, and ML prediction
 * Great for dashboards and overview pages
 */
const SessionMetricsCard: React.FC<SessionMetricsCardProps> = ({
  userId,
  gameSessionId,
  compact = false,
  onClick
}) => {
  const { gameMetrics, eyeTracking, mlPrediction, loading, error, fetchMetrics } =
    useSessionMetrics(userId, gameSessionId)

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (loading) {
    return (
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center gap-3">
          <Loader className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:shadow-xl ${
        onClick ? 'hover:scale-105' : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Session Metrics</h3>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {compact ? (
          // Compact view - Single row metrics
          <div className="grid grid-cols-3 gap-4">
            {/* Game Accuracy */}
            {gameMetrics && (
              <div className="text-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accuracy</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {gameMetrics.accuracy.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Gaze Stability */}
            {eyeTracking && (
              <div className="text-center">
                <Eye className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gaze Stability</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {eyeTracking.gazeStabilityScore.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Risk Level */}
            {mlPrediction && (
              <div className="text-center">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</p>
                <p
                  className={`text-lg font-bold ${
                    mlPrediction.riskLevel === 'Low'
                      ? 'text-green-600'
                      : mlPrediction.riskLevel === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {mlPrediction.riskLevel}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Full view - Detailed metrics
          <div className="space-y-4">
            {/* Game Metrics */}
            {gameMetrics && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Game Performance</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Accuracy</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {gameMetrics.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Response Time</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {(gameMetrics.avgResponseTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Eye Tracking */}
            {eyeTracking && (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Eye Tracking</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Fixations</p>
                    <p className="font-bold text-cyan-600 dark:text-cyan-400">
                      {eyeTracking.totalFixations}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Stability</p>
                    <p className="font-bold text-cyan-600 dark:text-cyan-400">
                      {eyeTracking.gazeStabilityScore.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ML Prediction */}
            {mlPrediction && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">ML Prediction</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">Risk Level</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        mlPrediction.riskLevel === 'Low'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : mlPrediction.riskLevel === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {mlPrediction.riskLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">Confidence</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {(mlPrediction.confidenceScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default SessionMetricsCard
