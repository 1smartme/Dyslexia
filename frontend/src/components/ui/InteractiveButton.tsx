import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { playClickSound, createParticles } from '../../lib/gameEffects'

interface InteractiveButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'success' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  particles?: boolean
}

const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  particles = false
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (disabled) return
    
    playClickSound()
    
    if (particles && buttonRef.current) {
      createParticles(buttonRef.current)
    }
    
    onClick?.()
  }

  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[2.75rem]'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 focus:ring-red-500 dark:from-red-600 dark:to-pink-700 dark:hover:from-red-700 dark:hover:to-pink-800',
    outline: 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 focus:ring-blue-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:brightness-105'}`}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.button>
  )
}

export default InteractiveButton