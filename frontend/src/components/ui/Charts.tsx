import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  label?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  color = 'bg-blue-500', 
  label 
}) => {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div 
          className={`h-2 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  label
}) => {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
            {label && <div className="text-xs text-gray-500">{label}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="w-full">
      <div className="flex items-end justify-between" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40)
          return (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              <div className="text-sm font-medium mb-2">{item.value}</div>
              <motion.div
                className={`w-full rounded-t ${item.color || 'bg-blue-500'} min-h-[4px]`}
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
              <div className="text-xs text-gray-600 mt-2 text-center">{item.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LineChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  height = 200, 
  color = '#3B82F6' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((item.value - minValue) / range) * 80
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox="0 0 100 100" className="overflow-visible">
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = 100 - ((item.value - minValue) / range) * 80
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  let cumulativePercentage = 0
  
  return (
    <div className="flex items-center space-x-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const strokeDasharray = circumference
            const strokeDashoffset = circumference - (percentage / 100) * circumference
            const rotation = (cumulativePercentage / 100) * 360
            
            cumulativePercentage += percentage
            
            return (
              <motion.circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
                transform={`rotate(${rotation})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, delay: index * 0.2 }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}