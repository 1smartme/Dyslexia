import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  BookOpen,
  Shuffle,
  Target,
  Star,
  Trophy,
  Play,
  User,
  LogOut,
  BarChart3,
  Eye,
  Volume2,
  Zap,
  Search,
  Layers,
  GraduationCap,
  Users,
  Moon,
  Sun,
  RefreshCw,
  Clock
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { gameConfigs } from '../lib/gameConfig'

interface DashboardStats {
  totalGamesPlayed: number
  averageScore: number
  bestScore: number
  totalTimeMinutes: number
}

const Dashboard: React.FC = () => {
  const { user, signOut, isAdmin, isTeacher, isParent } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)

  const loadStats = async () => {
    if (!user?.id) return

    setStatsLoading(true)

    try {
      const res = await fetch(`http://localhost:5000/api/dashboard/${user.id}`)
      const data = await res.json()

      setDashboardStats({
        totalGamesPlayed: data.totalGames || 0,
        averageScore: data.averageScore || 0,
        bestScore: data.highestScore || 0,
        totalTimeMinutes: data.totalTimeMinutes || 0
      })
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  React.useEffect(() => {
    loadStats()
  }, [user?.id])

  // Redirect admin
  React.useEffect(() => {
    if (isAdmin) {
      window.location.href = '/admin'
    }
  }, [isAdmin])

  if (isAdmin) {
    return null
  }

  const iconMap = {
    BookOpen,
    Brain,
    Shuffle,
    Eye,
    Zap,
    Volume2,
    Search,
    GraduationCap
  }

  const games = Object.values(gameConfigs).map(config => ({
    ...config,
    icon: iconMap[config.icon as keyof typeof iconMap] || BookOpen,
    difficulty: `${config.levels[0].difficulty} to ${config.levels[config.levels.length - 1].difficulty}`,
    duration: config.estimatedDuration,
    color: config.levels[0].color,
    bgColor: config.levels[0].bgColor,
    levelCount: config.levels.length
  }))

  return (
    <div className="min-h-screen gradient-bg">

      {/* Navbar */}
      <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Dyslyze</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-300 hidden sm:block">
                Welcome, {user?.email?.split(/[.@]/)[0]}
              </span>

              <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {(isTeacher || isAdmin) && (
                <Link to="/teacher" className="btn btn-outline btn-sm">
                  <Users size={16} className="mr-2" />
                  Teacher
                </Link>
              )}

              {(isParent || isAdmin) && (
                <Link to="/parent" className="btn btn-outline btn-sm">
                  <User size={16} className="mr-2" />
                  Parent
                </Link>
              )}

              <Link to="/profile" className="btn btn-outline btn-sm">
                <User size={16} className="mr-2" />
                Profile
              </Link>

              <button onClick={signOut} className="btn btn-ghost btn-sm">
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Dashboard Stats */}
        {statsLoading ? (
          <div className="text-center">Loading your progress...</div>
        ) : dashboardStats && (
          <div className="mb-16">

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">📊 Your Progress</h2>
              <button onClick={loadStats} className="btn btn-ghost btn-sm">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-6">

              <div className="card p-6 text-center bg-white dark:bg-gray-800">
                <Trophy className="mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Games Played</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.totalGamesPlayed}
                </p>
              </div>

              <div className="card p-6 text-center bg-white dark:bg-gray-800">
                <Target className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(dashboardStats.averageScore)}%
                </p>
              </div>

              <div className="card p-6 text-center bg-white dark:bg-gray-800">
                <Star className="mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Best Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(dashboardStats.bestScore)}%
                </p>
              </div>

              <div className="card p-6 text-center bg-white dark:bg-gray-800">
                <Clock className="mx-auto mb-2 text-purple-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Time Played</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.totalTimeMinutes}m
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Games */}
        <div className="grid md:grid-cols-3 gap-6">
          {games.map(game => (
            <div
              key={game.id}
              className={`card p-6 bg-gradient-to-br ${game.bgColor} dark:from-gray-800 dark:to-gray-700`}
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${game.color} rounded-xl flex items-center justify-center mb-4`}>
                <game.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{game.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{game.description}</p>

              <Link
                to={`/game/${game.id}`}
                className={`btn w-full bg-gradient-to-r ${game.color} text-white`}
              >
                <Play size={16} className="mr-2" />
                Start Learning
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Dashboard
