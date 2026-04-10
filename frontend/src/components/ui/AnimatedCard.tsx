import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
  hover = true,
  onClick
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 game-text ${hover ? 'cursor-pointer' : ''} ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={hover ? {
        scale: 1.015,
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard