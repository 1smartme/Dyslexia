import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 btn btn-outline btn-sm shadow-md transition-all duration-300"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  )
}

export default ThemeToggle
