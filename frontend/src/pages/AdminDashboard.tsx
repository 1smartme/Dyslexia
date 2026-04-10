import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Brain, 
  ArrowLeft, 
  Users, 
  BarChart3, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

interface GameResult {
  id: string
  userId: string
  username: string
  gameType: string
  gameName: string
  difficulty: string
  score: number
  totalQuestions: number
  hasDyslexia: boolean
  completedAt: string
}

interface UserStats {
  totalUsers: number
  totalAssessments: number
  averageScore: number
  dyslexiaDetectionRate: number
  completionRate: number
  recentActivity: GameResult[]
  gameTypeStats: { [key: string]: number }
  difficultyStats: { [key: string]: number }
}

const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalAssessments: 0,
    averageScore: 0,
    dyslexiaDetectionRate: 0,
    completionRate: 0,
    recentActivity: [],
    gameTypeStats: {},
    difficultyStats: {}
  })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const gameResults: GameResult[] = JSON.parse(localStorage.getItem('gameResults') || '[]')
        
        // Calculate unique users
        const uniqueUsers = new Set(gameResults.map(result => result.userId))
        const totalUsers = uniqueUsers.size
        
        // Calculate total assessments
        const totalAssessments = gameResults.length
        
        // Calculate average score
        const averageScore = gameResults.length > 0 
          ? Math.round(gameResults.reduce((sum, result) => sum + (result.score / result.totalQuestions * 100), 0) / gameResults.length)
          : 0
        
        // Calculate dyslexia detection rate
        const dyslexiaDetected = gameResults.filter(result => result.hasDyslexia).length
        const dyslexiaDetectionRate = totalAssessments > 0 
          ? Math.round((dyslexiaDetected / totalAssessments) * 100)
          : 0
        
        // Completion rate (assuming all stored results are completed)
        const completionRate = 100
        
        // Recent activity (last 10 results)
        const recentActivity = gameResults
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 10)
        
        // Game type statistics
        const gameTypeStats = gameResults.reduce((acc, result) => {
          acc[result.gameName] = (acc[result.gameName] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
        
        // Difficulty statistics
        const difficultyStats = gameResults.reduce((acc, result) => {
          acc[result.difficulty] = (acc[result.difficulty] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
        
        setStats({
          totalUsers,
          totalAssessments,
          averageScore,
          dyslexiaDetectionRate,
          completionRate,
          recentActivity,
          gameTypeStats,
          difficultyStats
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    }

    loadAnalytics()
    
    // Set up interval to refresh data every 5 seconds
    const interval = setInterval(loadAnalytics, 5000)
    
    return () => clearInterval(interval)
  }, [refreshKey])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email?.split(/[.@]/)[0]}</span>
              <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={refreshData}
                className="btn btn-ghost btn-sm"
                title="Refresh Data"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button onClick={signOut} className="btn btn-ghost btn-sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Real-Time Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Live monitoring of user assessments and platform performance
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Data - Updates every 5 seconds
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div 
            className="card p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-gray-600">Total Users</div>
          </motion.div>

          <motion.div 
            className="card p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</div>
            <div className="text-gray-600">Assessments</div>
          </motion.div>

          <motion.div 
            className="card p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
            <div className="text-gray-600">Avg Score</div>
          </motion.div>



          <motion.div 
            className="card p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
            <div className="text-gray-600">Completion</div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* User Results by User */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Results Summary
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(() => {
                const gameResults: GameResult[] = JSON.parse(localStorage.getItem('gameResults') || '[]')
                const userGroups = gameResults.reduce((acc, result) => {
                  if (!acc[result.userId]) {
                    acc[result.userId] = {
                      username: result.username,
                      results: [],
                      totalGames: 0,
                      averageScore: 0,
                      hasDyslexiaCount: 0
                    }
                  }
                  acc[result.userId].results.push(result)
                  acc[result.userId].totalGames++
                  acc[result.userId].averageScore += (result.score / result.totalQuestions * 100)
                  if (result.hasDyslexia) acc[result.userId].hasDyslexiaCount++
                  return acc
                }, {} as any)
                
                Object.keys(userGroups).forEach(userId => {
                  userGroups[userId].averageScore = Math.round(userGroups[userId].averageScore / userGroups[userId].totalGames)
                })
                
                return Object.entries(userGroups).length > 0 ? (
                  Object.entries(userGroups).map(([userId, userData]: [string, any]) => (
                    <div key={userId} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{userData.username}</div>
                            <div className="text-sm text-gray-600">{userData.totalGames} assessments completed</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${userData.averageScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {userData.averageScore}% avg
                          </div>
                          <div className="text-xs text-gray-500">
                            {userData.hasDyslexiaCount > userData.totalGames / 2 ? '⚠️ At Risk' : '✅ Normal'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {userData.results.slice(0, 3).map((result: GameResult) => (
                          <div key={result.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{result.gameName} ({result.difficulty})</span>
                            <span className={`font-medium ${getScoreColor(result.score, result.totalQuestions)}`}>
                              {result.score}/{result.totalQuestions}
                            </span>
                          </div>
                        ))}
                        {userData.results.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{userData.results.length - 3} more results
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No user data available yet
                  </div>
                )
              })()}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="card p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{result.username}</div>
                        <div className="text-sm text-gray-600">{result.gameName} - {result.difficulty}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getScoreColor(result.score, result.totalQuestions)}`}>
                        {result.score}/{result.totalQuestions}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(result.completedAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No assessment data available yet
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <button 
            onClick={refreshData}
            className="btn btn-primary"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh Analytics
          </button>
          <Link to="/" className="btn btn-outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard