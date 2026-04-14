import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Star, Trophy, Lightbulb } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getLearningProfile, updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { DIFFICULTY_SETTINGS, getGameContent, pickConfusingWord } from '../../data/difficultySystem'

interface GameState {
  currentWord: string
  options: string[]
  correctIndex: number
  selectedIndex: number | null
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHint: boolean
  startTime: number
  level: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalReactionTime: number
  sessionStartTime: number
}

const WordRecognitionLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    currentWord: '',
    options: [],
    correctIndex: 0,
    selectedIndex: null,
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHint: false,
    startTime: 0,
    level: 1,
    category: 'animals',
    difficulty: 'easy',
    totalReactionTime: 0,
    sessionStartTime: Date.now()
  })
  const [, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const emojiLookup = Object.fromEntries(
    (['easy', 'medium', 'hard'] as const)
      .flatMap(diff => getGameContent(diff).map(item => [item.word, item.image]))
  ) as Record<string, string>

  const maxRounds = DIFFICULTY_SETTINGS[gameState.difficulty].rounds

  const generateRound = () => {
    if (!user) return
    
    const adaptiveDiff = getAdaptiveDifficulty(user.email || '', 'wordRecognition')
    const contentPool = getGameContent(gameState.difficulty)
    const pool = contentPool.map(item => item.word)
    const word = pool[Math.floor(Math.random() * pool.length)]
    const settings = {
      easy: { optionsCount: 3 },
      medium: { optionsCount: 5 },
      hard: { optionsCount: 8 }
    }[gameState.difficulty]
    const options = [word]
    const usedWords = new Set([word])
    
    while (options.length < settings.optionsCount) {
      const randomWord = pool[Math.floor(Math.random() * pool.length)]
      if (!usedWords.has(randomWord)) {
        options.push(randomWord)
        usedWords.add(randomWord)
      }
    }

    if (gameState.difficulty === 'hard') {
      const confusingWord = pickConfusingWord(word) || `${word.slice(0, -1)}e`
      if (!usedWords.has(confusingWord)) {
        options[options.length - 1] = confusingWord
      }
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    
    const correctIndex = options.indexOf(word)
    
    setGameState(prev => ({
      ...prev,
      currentWord: word,
      options,
      correctIndex,
      selectedIndex: null,
      feedback: '',
      showHint: false,
      startTime: Date.now(),
      level: adaptiveDiff.level
    }))
    
    // Speak the word
    setTimeout(() => speakText(word, 0.7), 500)
  }

  const handleWordSelect = (index: number) => {
    if (gameState.selectedIndex !== null || isTransitioning) return
    
    const isCorrect = index === gameState.correctIndex
    const reactionTime = Date.now() - gameState.startTime
    const accuracy = isCorrect ? 1 : 0
    
    setGameState(prev => ({ ...prev, selectedIndex: index, totalReactionTime: prev.totalReactionTime + reactionTime }))
    
    if (user) {
      const profile = updateGameProgress(user.email || '', 'wordRecognition', {
        accuracy,
        reactionTime,
        difficulty: gameState.level,
        timestamp: Date.now()
      })
      
      const recentAccuracy = profile.wordRecognition.averageAccuracy
      const isImprovement = profile.wordRecognition.attempts.length > 1 && 
        accuracy > profile.wordRecognition.attempts[profile.wordRecognition.attempts.length - 2].accuracy
      
      setGameState(prev => ({
        ...prev,
      score: prev.score + (isCorrect ? DIFFICULTY_SETTINGS[gameState.difficulty].scoreMultiplier : 0),
        feedback: getEncouragingMessage(recentAccuracy, isImprovement)
      }))
    }
    
    if (isCorrect) {
      speakText("Correct! Well done!")
    } else {
      speakText(`Not quite. The correct word was ${gameState.currentWord}`)
    }
    
    setIsTransitioning(true)
    setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
      setIsTransitioning(false)
    }, 2000)
  }

  const showHint = () => {
    if (!DIFFICULTY_SETTINGS[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    setGameState(prev => ({ ...prev, showHint: true }))
    speakText(`Listen again: ${gameState.currentWord}`, 0.5)
  }

  const resetGame = () => {
    setGameState({
      currentWord: '',
      options: [],
      correctIndex: 0,
      selectedIndex: null,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHint: false,
      startTime: 0,
      level: 1,
      category: 'general',
      difficulty: 'easy',
        totalReactionTime: 0,
      sessionStartTime: Date.now()
    })
    setHasStarted(false)
    setIsTransitioning(false)
  }

  useEffect(() => {
    if (!user || !hasStarted) return
    generateRound()
  }, [user, hasStarted])

  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      selectedIndex: null,
      difficulty: selectedDifficulty,
      totalReactionTime: 0,
      sessionStartTime: Date.now()
    }))
    setScoreSaved(false)
    setHasStarted(true)
    setIsTransitioning(false)
    window.setTimeout(() => generateRound(), 0)
  }

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        const mult = DIFFICULTY_SETTINGS[gameState.difficulty].scoreMultiplier
        const correctAnswers = Math.min(
          maxRounds,
          Math.round(gameState.score / Math.max(0.001, mult))
        )
        await saveGameScore({
          userId: String(user.id),
          gameName: 'word_recognition',
          difficulty: gameState.difficulty.toString(),
          accuracy: maxRounds ? gameState.score / (maxRounds * mult) : 0,
          avgResponseTime: gameState.totalReactionTime / Math.max(1, maxRounds),
          errors: {},
          score: gameState.score,
          sessionSummary: {
            gameType: 'word_recognition',
            correct: correctAnswers,
            total: maxRounds,
          },
        })
      } catch (error) {
        console.error('Failed to save word recognition score:', error)
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.difficulty, gameState.totalReactionTime])

  if (gameState.gameOver) {
    const profile = user ? getLearningProfile(user.email || '') : null
    const badges = profile?.wordRecognition.badges || []
    
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div 
          className="card p-8 text-center max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Learning Session Complete!</h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600 dark:text-gray-300">Score: {gameState.score}/{maxRounds}</p>
            <p className="text-gray-600 dark:text-gray-300">Current Level: {gameState.level}</p>
            {badges.length > 0 && (
              <div className="flex justify-center space-x-2 mt-4">
                {badges.map(badge => (
                  <div key={badge} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    🏆 {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={resetGame} className="btn btn-primary w-full">
            Continue Learning
          </button>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Choose Difficulty</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Select a level before starting the game.</p>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button key={diff} onClick={() => startGameWithDifficulty(diff)} className="btn btn-outline">
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="flex gap-4 max-w-7xl mx-auto">
        <div className="flex-1">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Word Recognition Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score}/{maxRounds}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">Round {gameState.round} of {maxRounds}</p>
            <p className="text-lg font-semibold text-primary-600">
              Listen and click the word you hear
            </p>
          </div>
        </div>

        {/* Audio Control */}
        <div className="card p-6 mb-6 text-center">
          <div className="mb-4">
            <Volume2 className="w-12 h-12 text-primary-500 mx-auto mb-2" />
            <p className="text-lg font-semibold">Listen carefully...</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => speakText(gameState.currentWord, 0.7)}
              className="btn btn-outline"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Repeat
            </button>
            
            <button 
              onClick={showHint}
              className="btn btn-ghost"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint
            </button>
          </div>
          
          {gameState.showHint && (
            <motion.div 
              className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              💡 Listen to the slower pronunciation and focus on each sound
            </motion.div>
          )}
        </div>

        {/* Word Options */}
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4">
            {gameState.options.map((word, index) => {
              const isSelected = gameState.selectedIndex === index
              const isCorrect = index === gameState.correctIndex

              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleWordSelect(index)}
                  className={`
                    p-6 rounded-lg border-2 text-xl font-semibold transition-all duration-200
                    ${isSelected 
                      ? isCorrect 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700'
                    }
                  `}
                  whileHover={!isSelected ? { scale: 1.02 } : {}}
                  whileTap={!isSelected ? { scale: 0.98 } : {}}
                  disabled={gameState.selectedIndex !== null}
                >
                  <span className="inline-flex items-center gap-2">
                    {gameState.difficulty === 'easy' && emojiLookup[word] ? <span>{emojiLookup[word]}</span> : null}
                    <span>{word}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
          
          {gameState.feedback && (
            <motion.div 
              className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {gameState.feedback}
            </motion.div>
          )}
        </div>

        {/* Category Selector */}
        <div className="card p-4 mt-6">
          <p className="text-sm font-medium mb-2">Difficulty Level:</p>
          <div className="flex space-x-2 mb-4">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setGameState(prev => ({ ...prev, difficulty: diff }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  gameState.difficulty === diff
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">Easy: simple words, Medium: moderate words, Hard: complex + confusing words.</p>
        </div>
      </div>
      
      <div className="w-96 flex-shrink-0 flex items-start justify-center">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="word-recognition"
          difficulty={gameState.difficulty}
          totalQuestions={maxRounds}
          isGamePage={true}
          errors={[]}
        />
      </div>
      </div>
    </div>
  )
}

export default WordRecognitionLearning