import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, ArrowLeft, Users, TrendingUp, Clock, Star, Trophy, Target, Plus, User, BarChart3, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getLearningProfile, getStreakBadge } from '../lib/learningProgress'
import { CircularProgress, BarChart, LineChart, ProgressBar } from '../components/ui/Charts'

interface Child {
  id: string
  name: string
  email: string
  addedDate: string
}

const ParentDashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [childProgress, setChildProgress] = useState<any>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [newChildEmail, setNewChildEmail] = useState('')

  useEffect(() => {
    loadChildren()
  }, [user])

  useEffect(() => {
    if (selectedChild) {
      loadChildProgress(selectedChild.email)
    }
  }, [selectedChild])

  const loadChildren = () => {
    if (!user?.email) return
    const stored = localStorage.getItem(`parent_children_${user.email}`)
    const childrenList = stored ? JSON.parse(stored) : []
    setChildren(childrenList)
    if (childrenList.length > 0 && !selectedChild) {
      setSelectedChild(childrenList[0])
    }
  }

  const loadChildProgress = (childEmail: string) => {
    const profile = getLearningProfile(childEmail)
    setChildProgress(profile)
  }

  const addChild = () => {
    if (!newChildName || !newChildEmail || !user?.email) return
    
    const newChild: Child = {
      id: Date.now().toString(),
      name: newChildName,
      email: newChildEmail,
      addedDate: new Date().toISOString()
    }
    
    const updatedChildren = [...children, newChild]
    setChildren(updatedChildren)
    localStorage.setItem(`parent_children_${user.email}`, JSON.stringify(updatedChildren))
    
    setNewChildName('')
    setNewChildEmail('')
    setShowAddChild(false)
    setSelectedChild(newChild)
  }

  const removeChild = (childId: string) => {
    const updatedChildren = children.filter(child => child.id !== childId)
    setChildren(updatedChildren)
    if (user?.email) {
      localStorage.setItem(`parent_children_${user.email}`, JSON.stringify(updatedChildren))
    }
    if (selectedChild?.id === childId) {
      setSelectedChild(updatedChildren[0] || null)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Parent Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link to="/games" className="btn btn-outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Link>
              <button onClick={signOut} className="btn btn-ghost">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.email?.split(/[.@]/)[0]}!</h1>
          <p className="text-gray-600">Monitor your children's learning progress</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Children List */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">My Children</h2>
                <button onClick={() => setShowAddChild(true)} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
              
              <div className="space-y-2">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedChild?.id === child.id 
                        ? 'bg-primary-50 border-primary-200' 
                        : 'bg-white border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <div className="font-medium">{child.name}</div>
                    <div className="text-sm text-gray-500">{child.email}</div>
                  </button>
                ))}
                
                {children.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No children added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Child Progress */}
          <div className="lg:col-span-3">
            {selectedChild && childProgress ? (
              <div className="space-y-6">
                {/* Child Header */}
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedChild.name}'s Progress</h2>
                      <p className="text-gray-600">{selectedChild.email}</p>
                    </div>
                    <div className={`px-4 py-2 bg-gradient-to-r ${getStreakBadge(childProgress.dailyStreak).color} rounded-lg text-white`}>
                      <div className="text-lg font-bold">{childProgress.dailyStreak} Day Streak</div>
                      <div className="text-sm">{getStreakBadge(childProgress.dailyStreak).emoji} {getStreakBadge(childProgress.dailyStreak).name}</div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid with Charts */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Learning Progress</h3>
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <CircularProgress 
                      value={childProgress.wordRecognition.level} 
                      max={10} 
                      color="#F59E0B" 
                      label="Level"
                    />
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Accuracy Rate</h3>
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <CircularProgress 
                      value={childProgress.wordRecognition.averageAccuracy * 100} 
                      max={100} 
                      color="#10B981" 
                      label="Accuracy"
                    />
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Activity</h3>
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{childProgress.wordRecognition.totalAttempts}</div>
                      <div className="text-gray-600">Games Played</div>
                      <ProgressBar 
                        value={childProgress.wordRecognition.totalAttempts} 
                        max={50} 
                        color="bg-blue-500" 
                      />
                    </div>
                  </div>
                </div>

                {/* Game Progress with Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Learning Areas Progress</h3>
                    <BarChart 
                      data={Object.entries(childProgress).filter(([key]) => 
                        ['wordRecognition', 'letterSequencing', 'readingComprehension'].includes(key)
                      ).map(([gameType, progress]: [string, any]) => ({
                        label: gameType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                        value: progress.level,
                        color: gameType === 'wordRecognition' ? 'bg-blue-500' : 
                               gameType === 'letterSequencing' ? 'bg-green-500' : 'bg-purple-500'
                      }))}
                    />
                  </div>
                  
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Accuracy Trends</h3>
                    <LineChart 
                      data={childProgress.wordRecognition.attempts.slice(-7).map((attempt: any, index: number) => ({
                        label: `Day ${index + 1}`,
                        value: attempt.accuracy * 100
                      }))}
                      color="#10B981"
                    />
                  </div>
                </div>

                {/* Badges with Progress */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">Achievement Progress</h3>
                  <div className="space-y-4">
                    {[
                      { days: 3, emoji: '⭐', name: 'Star', color: '#F59E0B' },
                      { days: 21, emoji: '🌟', name: 'Superstar', color: '#3B82F6' },
                      { days: 50, emoji: '🏆', name: 'Champion', color: '#10B981' },
                      { days: 100, emoji: '🏛️', name: 'Hall of Fame', color: '#8B5CF6' },
                      { days: 150, emoji: '👑', name: 'Golden', color: '#F59E0B' }
                    ].map(badge => {
                      const earned = childProgress.dailyStreak >= badge.days
                      const progress = Math.min(childProgress.dailyStreak / badge.days, 1)
                      return (
                        <div key={badge.days} className="flex items-center space-x-4">
                          <div className={`text-2xl ${earned ? '' : 'grayscale opacity-50'}`}>
                            {badge.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{badge.name}</span>
                              <span className="text-gray-500">{Math.min(childProgress.dailyStreak, badge.days)}/{badge.days} days</span>
                            </div>
                            <ProgressBar 
                              value={Math.min(childProgress.dailyStreak, badge.days)} 
                              max={badge.days} 
                              color={earned ? 'bg-green-500' : 'bg-blue-500'}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
                <p className="text-gray-600">Choose a child from the list to view their progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Child</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Child's Name</label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter child's name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Child's Email</label>
                <input
                  type="email"
                  value={newChildEmail}
                  onChange={(e) => setNewChildEmail(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter child's email"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={addChild} className="btn btn-primary flex-1">Add Child</button>
              <button onClick={() => setShowAddChild(false)} className="btn btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard