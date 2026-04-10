import React, { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameContentProps {
  children: ReactNode
  className?: string
  centerContent?: boolean
}

export const GameContent: React.FC<GameContentProps> = ({
  children,
  className = '',
  centerContent = true
}) => {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 game-text ${
        centerContent ? 'flex flex-col items-center justify-center' : ''
      } ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

interface AnswerGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({
  children,
  columns = 2,
  gap = 'md'
}) => {
  const gapMap = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }

  const colsMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid ${colsMap[columns]} ${gapMap[gap]} w-full`}>
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  )
}

interface FeedbackOverlayProps {
  show: boolean
  type: 'success' | 'error' | 'info'
  message: string
  emoji?: string
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  show,
  type,
  message,
  emoji = '🎉'
}) => {
  const bgColorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${bgColorMap[type]} bg-opacity-85`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 0.95, 1] }}
              transition={{ duration: 0.6 }}
            >
              {emoji}
            </motion.div>
            <motion.p
              className="text-2xl font-bold text-white max-w-md"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface GameSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export const GameSection: React.FC<GameSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center leading-relaxed">
          {title}
        </h2>
      )}
      {children}
    </motion.div>
  )
}

interface GameButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const variantMap = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
  }

  const sizeMap = {
    sm: 'px-3 py-2 text-sm min-h-[2.5rem]',
    md: 'px-6 py-3 text-base min-h-[2.75rem]',
    lg: 'px-8 py-4 text-lg min-h-[3rem]'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${variantMap[variant]} ${sizeMap[size]} rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {children}
    </motion.button>
  )
}
