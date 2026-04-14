import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import InteractiveButton from '../ui/InteractiveButton'

interface GameResultsScreenProps {
  title: string
  emoji?: string
  score: number
  totalQuestions?: number
  accuracy?: number
  stats?: Array<{
    label: string
    value: string
    className?: string
  }>
  onPlayAgain: () => void
  onBack?: () => void
  children?: React.ReactNode
}

const GameResultsScreen: React.FC<GameResultsScreenProps> = ({
  title,
  emoji = '🎉',
  score,
  totalQuestions,
  accuracy,
  stats = [],
  onPlayAgain,
  onBack,
  children
}) => {
  const navigate = useNavigate()

  const handleExploreGames = () => {
    navigate('/games')
  }

  const handleViewProfile = () => {
    navigate('/profile')
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="card p-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="mb-8">
            <div className="text-6xl mb-4">{emoji}</div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>

          {/* Score Section */}
          {totalQuestions && (
            <div className="mb-8">
              <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-2">
                Score: {score}/{totalQuestions}
              </p>
              {accuracy !== undefined && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Accuracy: {accuracy.toFixed(1)}%
                </p>
              )}
            </div>
          )}

          {/* Stats Section */}
          {stats.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-lg font-bold ${stat.className || 'text-gray-900 dark:text-white'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Content */}
          {children && <div className="mb-8">{children}</div>}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <InteractiveButton 
              onClick={onPlayAgain} 
              variant="success"
              className="min-w-[140px]"
            >
              Play Again
            </InteractiveButton>
            
            <InteractiveButton 
              onClick={handleExploreGames}
              variant="primary"
              className="min-w-[140px]"
            >
              Explore More Games
            </InteractiveButton>
            
            <InteractiveButton 
              onClick={handleViewProfile}
              variant="outline"
              className="min-w-[140px]"
            >
              View Profile
            </InteractiveButton>

            {onBack && (
              <InteractiveButton 
                onClick={onBack}
                variant="outline"
                className="min-w-[140px]"
              >
                Back to Dashboard
              </InteractiveButton>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default GameResultsScreen
