import React, { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Brain,
  ArrowLeft,
  User,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Moon,
  Sun,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getLearningProfile } from '../lib/learningProgress'
import { getAssessment } from '../services/assessmentService'
import { getRecentScores } from '../services/scoreService'

/* ================= TYPES ================= */

interface GameResult {
  id: string
  gameName: string
  difficulty: string
  score: number
  totalQuestions: number
  completedAt: string
}

interface UserStats {
  totalGames: number
  averageScore: number
  bestScore: number
  gamesPlayed: Record<string, number>
  recentGames: GameResult[]
  totalTime: number
  achievements: string[]
}

interface ProgressStatsResponse {
  totalGamesPlayed: number
  averageScore: number
  bestScore: number
  totalTimePlayed: number
  recentGames: Array<{
    id: number
    game_name: string
    score: number
    created_at: string
  }>
}

interface DyslexiaSessionReport {
  session_id: string
  user_id: string
  game_type: string
  difficulty: string
  score: number
  total: number
  accuracy: number
  fixation_mean_dur: number
  regressions_count: number
  reading_speed_wpm: number
  risk: string | null
  risk_score?: number | null
  timestamp: string
}

interface DyslexiaSessionsApiResponse {
  latest: DyslexiaSessionReport
  sessions: DyslexiaSessionReport[]
}

/* ================= COMPONENT ================= */

const ProfilePage: React.FC = () => {
  const { user, signOut, isTeacher, isParent, isAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  /* ================= REDIRECTS ================= */

  if (!user) return <Navigate to="/auth" replace />
  if (isTeacher) return <Navigate to="/teacher" replace />
  if (isParent) return <Navigate to="/parent" replace />
  if (isAdmin) return <Navigate to="/admin" replace />

  /* ================= STATE ================= */

  const [stats, setStats] = useState<UserStats>({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    gamesPlayed: {},
    recentGames: [],
    totalTime: 0,
    achievements: [],
  })

  const [learningProfile, setLearningProfile] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [dyslexiaReport, setDyslexiaReport] = useState<DyslexiaSessionReport | null>(null)
  const [dyslexiaSessions, setDyslexiaSessions] = useState<DyslexiaSessionReport[]>([])

  const displayName = user?.username
    ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}`
    : 'User'

  const learningCards = [
    {
      title: 'Word Recognition',
      level: learningProfile?.wordRecognition?.level ?? 1,
      accuracy: Math.round((learningProfile?.wordRecognition?.averageAccuracy ?? 0) * 100),
    },
    {
      title: 'Reading Comprehension',
      level: learningProfile?.readingComprehension?.level ?? 1,
      accuracy: Math.round((learningProfile?.readingComprehension?.averageAccuracy ?? 0) * 100),
    },
    {
      title: 'Letter Sequencing',
      level: learningProfile?.letterSequencing?.level ?? 1,
      accuracy: Math.round((learningProfile?.letterSequencing?.averageAccuracy ?? 0) * 100),
    },
  ]

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const refreshLearningProfile = () => {
      if (!user) return
      const profile = getLearningProfile(user.email)
      setLearningProfile(profile)
    }

    const onProfileUpdated = () => {
      refreshLearningProfile()
    }

    const onWindowFocus = () => {
      refreshLearningProfile()
    }

    const loadData = async () => {
      try {
        if (!user) return
        let fetchedDyslexiaSessions: DyslexiaSessionReport[] = []

        // Learning profile
        const profile = getLearningProfile(user.email)
        setLearningProfile(profile)

        // Assessment
        const assessmentData = await getAssessment(String(user.id))
        setAssessment(assessmentData)

        // Latest dyslexia assessment session
        try {
          const dyslexiaRes = await fetch(`http://localhost:5000/api/dyslexia/sessions/${String(user.id)}`)
          if (dyslexiaRes.ok) {
            const report: DyslexiaSessionsApiResponse = await dyslexiaRes.json()
            setDyslexiaReport(report.latest ?? null)
            setDyslexiaSessions(report.sessions ?? [])
            fetchedDyslexiaSessions = report.sessions ?? []
            console.log('Profile Data Loaded', fetchedDyslexiaSessions.length)
          } else {
            setDyslexiaReport(null)
            setDyslexiaSessions([])
          }
        } catch (dyslexiaError) {
          console.warn('Dyslexia report endpoint unavailable:', dyslexiaError)
          setDyslexiaReport(null)
          setDyslexiaSessions([])
        }

        const token = localStorage.getItem('token')
        let progressStats: ProgressStatsResponse | null = null

        try {
          const statsResponse = await fetch('http://localhost:5000/api/progress/stats', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (statsResponse.ok) {
            progressStats = await statsResponse.json()
          }
        } catch (statsError) {
          console.warn('Progress stats endpoint unavailable, falling back to scores:', statsError)
        }

        // Fallback to scores API when stats endpoint fails.
        const backendScores = progressStats?.recentGames?.length
          ? progressStats.recentGames
          : await getRecentScores(100, String(user.id))
        const results = backendScores || []

        const totalGamesFromSessions = fetchedDyslexiaSessions.length
        const sessionAveragePercent = totalGamesFromSessions > 0
          ? Math.round(
              (fetchedDyslexiaSessions.reduce((sum, s) => sum + ((Number(s.total) > 0 ? Number(s.score) / Number(s.total) : 0) * 100), 0)) /
                totalGamesFromSessions
            )
          : null
        const sessionBestPercent = totalGamesFromSessions > 0
          ? Math.round(
              Math.max(
                ...fetchedDyslexiaSessions.map((s) => (Number(s.total) > 0 ? (Number(s.score) / Number(s.total)) * 100 : 0))
              )
            )
          : null

        const totalGames = totalGamesFromSessions || progressStats?.totalGamesPlayed || results.length
        const averageScore =
          sessionAveragePercent ??
          progressStats?.averageScore ??
          (totalGames > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + Number(r.score || 0), 0) / totalGames)
            : 0)
        const bestScore =
          sessionBestPercent ??
          progressStats?.bestScore ??
          (totalGames > 0 ? Math.max(...results.map((r: any) => Number(r.score || 0))) : 0)

        const gamesPlayed = results.reduce((acc: Record<string, number>, r: any) => {
          const gameName = r.game_name || r.game || 'Unknown'
          acc[gameName] = (acc[gameName] || 0) + 1
          return acc
        }, {})

        const recentGames: GameResult[] = totalGamesFromSessions > 0
          ? [...fetchedDyslexiaSessions]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5)
              .map((s) => ({
                id: s.session_id,
                gameName: s.game_type,
                difficulty: s.difficulty || 'Medium',
                score: Number(s.score || 0),
                totalQuestions: Number(s.total || 1),
                completedAt: s.timestamp,
              }))
          : [...results]
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((r: any) => {
                const normalizedScore = Number(r.score || 0)
                const totalQuestions = normalizedScore <= 10 ? 10 : 100
                return {
                  id: String(r.id),
                  gameName: r.game_name || r.game || 'Game',
                  difficulty: r.difficulty || 'Medium',
                  score: normalizedScore,
                  totalQuestions,
                  completedAt: r.created_at,
                }
              })

        const achievements: string[] = []
        if (totalGames >= 1) achievements.push('First Steps')
        if (totalGames >= 5) achievements.push('Getting Started')
        if (totalGames >= 10) achievements.push('Dedicated Player')
        if (averageScore >= 80) achievements.push('High Achiever')
        if (bestScore === 100) achievements.push('Perfect Score')

        setStats({
          totalGames,
          averageScore,
          bestScore,
          gamesPlayed,
          recentGames,
          totalTime: (progressStats?.totalTimePlayed ?? 0) / 60000,
          achievements,
        })
      } catch (error) {
        console.error('Error loading profile data:', error)
      }
    }

    const onScoreUpdated = () => {
      loadData()
    }

    window.addEventListener('learningProfileUpdated', onProfileUpdated)
    window.addEventListener('scoreUpdated', onScoreUpdated)
    window.addEventListener('focus', onWindowFocus)
    loadData()

    return () => {
      window.removeEventListener('learningProfileUpdated', onProfileUpdated)
      window.removeEventListener('scoreUpdated', onScoreUpdated)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [user])

  /* ================= HELPERS ================= */

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString()

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600'
    if (percent >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const mapGameTypeToRoute = (gameType: string) => {
    const normalized = (gameType || '').toLowerCase()
    if (normalized.includes('word-recognition')) return 'word-recognition-learning'
    if (normalized.includes('letter-sequencing')) return 'letter-sequencing-learning'
    if (normalized.includes('reading-comprehension')) return 'reading-comprehension-learning'
    if (normalized.includes('letter-mirror')) return 'letter-mirror-learning'
    if (normalized.includes('speed-words')) return 'speed-words-learning'
    if (normalized.includes('sound-twins')) return 'sound-twins-learning'
    if (normalized.includes('build-word')) return 'build-word-learning'
    if (normalized.includes('odd-one-out')) return 'odd-one-out-learning'
    return 'word-recognition-learning'
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen gradient-bg">
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold">Profile</span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme}>
              {isDark ? <Sun /> : <Moon />}
            </button>

            <Link to="/games" className="btn btn-outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Games
            </Link>

            <button onClick={signOut} className="btn btn-ghost">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold">
            {displayName}'s Profile
          </h1>

          <p className="text-gray-600 mt-2">
            Track your learning progress and daily streak
          </p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="card p-6 text-center">
            <Trophy className="mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.totalGames}</div>
            <div className="text-gray-600 text-sm">Games Played</div>
          </div>

          <div className="card p-6 text-center">
            <TrendingUp className="mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <div className="text-gray-600 text-sm">Average Score</div>
          </div>

          <div className="card p-6 text-center">
            <Target className="mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <div className="text-gray-600 text-sm">Best Score</div>
          </div>

          <div className="card p-6 text-center">
            <Clock className="mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">
              {Math.floor(stats.totalTime)}m
            </div>
            <div className="text-gray-600 text-sm">Time Played</div>
          </div>

          <div className="card p-6 text-center">
            <Moon className="mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">
              {learningProfile?.dailyStreak ?? 0}
            </div>
            <div className="text-gray-600 text-sm">Daily Streak</div>
          </div>
        </div>

        {/* LEARNING PROGRESS */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-6">Learning Progress</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {learningCards.map((card) => (
              <div key={card.title} className="card p-6">
                <div className="text-sm text-gray-500 mb-2">{card.title}</div>
                <div className="text-3xl font-bold mb-2">Level {card.level}</div>
                <div className="text-lg font-semibold">Accuracy {card.accuracy}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* DYSLEXIA ASSESSMENT REPORT */}
        <div className="card p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4">Dyslexia Assessment Report</h2>
          {dyslexiaReport ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Risk Level</div>
                <div className="text-lg font-semibold">
                  {dyslexiaReport.risk || 'Unknown'}
                  {typeof dyslexiaReport.risk_score === 'number' ? ` (${dyslexiaReport.risk_score.toFixed(2)})` : ''}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Accuracy</div>
                <div className="text-lg font-semibold">{Math.round((dyslexiaReport.accuracy || 0) * 100)}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Reading Speed</div>
                <div className="text-lg font-semibold">{Math.round(dyslexiaReport.reading_speed_wpm || 0)} WPM</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Timestamp</div>
                <div className="text-lg font-semibold">{new Date(dyslexiaReport.timestamp).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Fixation Duration</div>
                <div className="text-lg font-semibold">{Math.round(dyslexiaReport.fixation_mean_dur || 0)} ms</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">Regression Count</div>
                <div className="text-lg font-semibold">{dyslexiaReport.regressions_count || 0}</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No dyslexia assessment report available yet.</p>
          )}
          {dyslexiaReport && (
            <div className="mt-4">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/game/${mapGameTypeToRoute(dyslexiaReport.game_type)}`)}
              >
                Continue Last Game
              </button>
            </div>
          )}
        </div>

        {/* RECENT GAMES */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">
            Recent Activity
          </h2>

          {stats.recentGames.length > 0 ? (
            <div className="space-y-4">
              {stats.recentGames.map((game) => {
                const percent =
                  (game.score / game.totalQuestions) * 100

                return (
                  <div
                    key={game.id}
                    className="flex justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {game.gameName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {game.difficulty} • {formatDate(game.completedAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-semibold ${getScoreColor(percent)}`}
                      >
                        {game.score}/{game.totalQuestions}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(percent)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p>No games played yet.</p>
              <Link to="/games" className="btn btn-primary mt-4">
                Play a Game
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
