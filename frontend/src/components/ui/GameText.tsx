import React from 'react'
import { cn } from '../../lib/utils'

interface GameTextProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

const GameText: React.FC<GameTextProps> = ({ 
  children, 
  className = '', 
  size = 'md',
  weight = 'normal'
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  return (
    <span className={cn(
      'font-dyslexic',
      sizeClasses[size],
      weightClasses[weight],
      className
    )}>
      {children}
    </span>
  )
}

export default GameText