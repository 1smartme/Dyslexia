import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
// import InteractiveButton from '../ui/InteractiveButton'
import ProgressBar from '../ui/ProgressBar'

interface GameShellProps {
  title: string
  round: number
  totalRounds: number
  score: number
  streak?: number
  timeLeft?: number
  difficulty?: number
  onBack?: () => void
  onReset?: () => void
  children: ReactNode
  showStreakBadge?: boolean
  showDifficultyBadge?: boolean
  className?: string
}

const GameShell: React.FC<GameShellProps> = ({
  title,
  round,
  totalRounds,
  score,
  streak,
  timeLeft,
  difficulty,
  onBack,
  onReset,
  children,
  showStreakBadge = true,
  showDifficultyBadge = true,
  className = ''
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate('/dashboard')
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 ${className}`}>
      {/* Header Bar */}
      <motion.div
        className="max-w-6xl mx-auto mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 w-full md:w-auto justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-center md:text-left flex-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {title}
          </motion.h1>

          {onReset && (
            <motion.button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 w-full md:w-auto justify-center"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-sm font-medium">Reset</span>
            </motion.button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Progress */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {round} / {totalRounds}
                </span>
              </div>
              <ProgressBar progress={round - 1} total={totalRounds} className="h-2" />
            </div>

            {/* Score */}
            <motion.div
              className="text-center px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
              whileHover={{ scale: 1.05 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
                Score
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {score}
              </p>
            </motion.div>

            {/* Time Left (if applicable) */}
            {timeLeft !== undefined && (
              <motion.div
                className={`text-center px-4 py-2 rounded-lg border ${
                  timeLeft <= 3
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
                }`}
                animate={timeLeft <= 3 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
              >
                <p className={`text-xs font-medium uppercase tracking-wide ${
                  timeLeft <= 3 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  Time Left
                </p>
                <p className={`text-2xl font-bold ${
                  timeLeft <= 3 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {timeLeft}s
                </p>
              </motion.div>
            )}

            {/* Streak Badge */}
            {showStreakBadge && streak !== undefined && streak >= 2 && (
              <motion.div
                className="text-center px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
                  🔥 Streak
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {streak}
                </p>
              </motion.div>
            )}

            {/* Difficulty Badge */}
            {showDifficultyBadge && difficulty !== undefined && difficulty > 1 && (
              <motion.div
                className="text-center px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
                  AI Level
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {difficulty}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Game Content */}
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default GameShell
