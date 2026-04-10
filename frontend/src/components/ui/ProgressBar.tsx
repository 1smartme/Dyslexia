import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number
  total: number
  className?: string
  showText?: boolean
  animated?: boolean
  color?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  className = '',
  showText = true,
  animated = true,
  color = 'from-blue-500 to-purple-600'
}) => {
  const percentage = Math.min((progress / total) * 100, 100)

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{progress}/{total}</span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 0.8 : 0,
            ease: "easeOut"
          }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0 bg-white opacity-30"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}
        </motion.div>
      </div>
      
      {showText && (
        <motion.div 
          className="text-center mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-lg font-bold text-gray-800">{percentage.toFixed(0)}%</span>
        </motion.div>
      )}
    </div>
  )
}

export default ProgressBar