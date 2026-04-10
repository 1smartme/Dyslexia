import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatScore(score: number, total: number = 10) {
  return `${score}/${total} (${Math.round((score / total) * 100)}%)`
}

export function getDyslexiaRisk(score: number, total: number = 10) {
  const percentage = (score / total) * 100
  
  if (percentage >= 80) return { level: 'Low', color: 'success' }
  if (percentage >= 60) return { level: 'Moderate', color: 'warning' }
  return { level: 'High', color: 'danger' }
}

export function getScoreColor(score: number, total: number = 10) {
  const percentage = (score / total) * 100
  
  if (percentage >= 80) return 'text-success-600'
  if (percentage >= 60) return 'text-warning-600'
  return 'text-danger-600'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}