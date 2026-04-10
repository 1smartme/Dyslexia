interface LearningAttempt {
  accuracy: number
  reactionTime: number
  difficulty: number
  timestamp: number
}

interface GameProgress {
  level: number
  totalAttempts: number
  averageAccuracy: number
  lastActivity: number
  attempts: LearningAttempt[]
  badges: string[]
}

interface UserLearningProfile {
  userId: string
  wordRecognition: GameProgress
  readingComprehension: GameProgress
  letterSequencing: GameProgress
  dailyStreak: number
  lastLoginDate: string
}

const defaultGameProgress = (): GameProgress => ({
  level: 1,
  totalAttempts: 0,
  averageAccuracy: 0,
  lastActivity: Date.now(),
  attempts: [],
  badges: []
})

export const getLearningProfile = (userId: string): UserLearningProfile => {
  const stored = localStorage.getItem(`learning_profile_${userId}`)
  if (stored) {
    const profile = JSON.parse(stored)
    // Update streak on profile load
    const today = new Date().toDateString()
    if (profile.lastLoginDate !== today) {
      const lastLogin = new Date(profile.lastLoginDate)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff > 1) {
        profile.dailyStreak = 0 // Reset streak if more than 1 day gap
      }
    }
    return profile
  }
  
  return {
    userId,
    wordRecognition: defaultGameProgress(),
    readingComprehension: defaultGameProgress(),
    letterSequencing: defaultGameProgress(),
    dailyStreak: 0,
    lastLoginDate: new Date().toDateString()
  }
}

export const getStreakBadge = (streak: number) => {
  if (streak >= 150) return { emoji: '👑', name: 'Golden', color: 'from-yellow-400 to-yellow-600' }
  if (streak >= 100) return { emoji: '🏛️', name: 'Hall of Fame', color: 'from-purple-400 to-purple-600' }
  if (streak >= 50) return { emoji: '🏆', name: 'Champion', color: 'from-orange-400 to-orange-600' }
  if (streak >= 21) return { emoji: '🌟', name: 'Superstar', color: 'from-blue-400 to-blue-600' }
  if (streak >= 3) return { emoji: '⭐', name: 'Star', color: 'from-green-400 to-green-600' }
  return { emoji: '🔥', name: 'Getting Started', color: 'from-gray-400 to-gray-600' }
}

export const updateGameProgress = (
  userId: string, 
  gameType: keyof Pick<UserLearningProfile, 'wordRecognition' | 'readingComprehension' | 'letterSequencing'>,
  attempt: LearningAttempt
) => {
  const profile = getLearningProfile(userId)
  const gameProgress = profile[gameType]
  
  // Update daily streak
  const today = new Date().toDateString()
  const lastLogin = new Date(profile.lastLoginDate)
  const todayDate = new Date(today)
  
  if (profile.lastLoginDate !== today) {
    const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      // Consecutive day
      profile.dailyStreak++
    } else if (daysDiff > 1) {
      // Streak broken
      profile.dailyStreak = 1
    }
    
    profile.lastLoginDate = today
  }
  
  // Add new attempt
  gameProgress.attempts.push(attempt)
  gameProgress.totalAttempts++
  gameProgress.lastActivity = Date.now()
  
  // Keep only last 10 attempts for performance
  if (gameProgress.attempts.length > 10) {
    gameProgress.attempts = gameProgress.attempts.slice(-10)
  }
  
  // Calculate average accuracy from last 5 attempts
  const recentAttempts = gameProgress.attempts.slice(-5)
  gameProgress.averageAccuracy = recentAttempts.reduce((sum, a) => sum + a.accuracy, 0) / recentAttempts.length
  
  // Adaptive difficulty adjustment
  if (gameProgress.averageAccuracy > 0.8 && recentAttempts.length >= 3) {
    gameProgress.level = Math.min(10, gameProgress.level + 1)
  } else if (gameProgress.averageAccuracy < 0.5 && recentAttempts.length >= 3) {
    gameProgress.level = Math.max(1, gameProgress.level - 1)
  }
  
  // Award game badges
  if (gameProgress.totalAttempts === 10 && !gameProgress.badges.includes('First Steps')) {
    gameProgress.badges.push('First Steps')
  }
  if (gameProgress.averageAccuracy > 0.9 && !gameProgress.badges.includes('Accuracy Master')) {
    gameProgress.badges.push('Accuracy Master')
  }
  if (gameProgress.level >= 5 && !gameProgress.badges.includes('Level Up')) {
    gameProgress.badges.push('Level Up')
  }
  
  // Award streak badges
  const streakBadges = [
    { days: 3, badge: '⭐ Star', name: 'Star' },
    { days: 21, badge: '🌟 Superstar', name: 'Superstar' },
    { days: 50, badge: '🏆 Champion', name: 'Champion' },
    { days: 100, badge: '🏛️ Hall of Fame', name: 'Hall of Fame' },
    { days: 150, badge: '👑 Golden', name: 'Golden' }
  ]
  
  streakBadges.forEach(({ days, name }) => {
    if (profile.dailyStreak >= days && !gameProgress.badges.includes(name)) {
      gameProgress.badges.push(name)
    }
  })
  
  localStorage.setItem(`learning_profile_${userId}`, JSON.stringify(profile))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('learningProfileUpdated', { detail: profile }))
  }
  return profile
}

export const getAdaptiveDifficulty = (userId: string, gameType: keyof Pick<UserLearningProfile, 'wordRecognition' | 'readingComprehension' | 'letterSequencing'>) => {
  const profile = getLearningProfile(userId)
  const gameProgress = profile[gameType]
  
  return {
    level: gameProgress.level,
    timeLimit: Math.max(5, 15 - gameProgress.level),
    complexity: Math.min(5, Math.floor(gameProgress.level / 2) + 1),
    hintsEnabled: gameProgress.averageAccuracy < 0.6
  }
}

export const getEncouragingMessage = (accuracy: number, isImprovement: boolean): string => {
  if (accuracy >= 0.9) return "🌟 Excellent work! You're mastering this!"
  if (accuracy >= 0.7) return "👏 Great job! Keep up the good work!"
  if (accuracy >= 0.5) return "💪 Good effort! You're improving!"
  if (isImprovement) return "📈 Nice progress! Keep practicing!"
  return "🎯 Don't give up! Every attempt makes you stronger!"
}

let cachedPreferredVoice: SpeechSynthesisVoice | null = null

const getPreferredVoice = (): SpeechSynthesisVoice | null => {
  if (!('speechSynthesis' in window)) return null
  if (cachedPreferredVoice) return cachedPreferredVoice

  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null

  const femaleHint = /(female|zira|samantha|veena|heera|aditi)/i
  const byPriority = [
    (v: SpeechSynthesisVoice) => /^en-IN$/i.test(v.lang) && femaleHint.test(v.name),
    (v: SpeechSynthesisVoice) => /^en-IN$/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /^en-/i.test(v.lang) && femaleHint.test(v.name),
    (v: SpeechSynthesisVoice) => /^en-/i.test(v.lang)
  ]

  for (const matcher of byPriority) {
    const match = voices.find(matcher)
    if (match) {
      cachedPreferredVoice = match
      return match
    }
  }

  cachedPreferredVoice = voices[0] ?? null
  return cachedPreferredVoice
}

export const speakText = (text: string, rate: number = 0.8) => {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-IN'
  utterance.rate = rate
  utterance.pitch = 1.1
  utterance.volume = 1

  const preferredVoice = getPreferredVoice()
  if (preferredVoice) {
    utterance.voice = preferredVoice
  } else {
    // Some browsers load voices lazily; retry when they become available.
    const handleVoicesChanged = () => {
      const delayedVoice = getPreferredVoice()
      if (delayedVoice) utterance.voice = delayedVoice
      speechSynthesis.speak(utterance)
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
    }
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true })
    return
  }

  speechSynthesis.speak(utterance)
}