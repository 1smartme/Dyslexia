import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Volume2, Star, Trophy, Play, Pause } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getLearningProfile, updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { DIFFICULTY_SETTINGS } from '../../data/difficultySystem'

interface Passage {
  text: string
  questions: { question: string; options: string[]; correct: number }[]
  level: number
}

interface GameState {
  currentPassage: Passage | null
  currentQuestion: number
  selectedAnswers: (number | null)[]
  score: number
  round: number
  gameOver: boolean
  feedback: string
  isReading: boolean
  currentWordIndex: number
  startTime: number
  readingSpeed: number
  guidedMode: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  totalQuestions: number
  sessionStartTime: number
  gameErrors: Array<{ expected: string; actual: string }>
}

const ReadingComprehensionLearning: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState<GameState>({
    currentPassage: null,
    currentQuestion: 0,
    selectedAnswers: [],
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    isReading: false,
    currentWordIndex: -1,
    startTime: 0,
    readingSpeed: 0,
    guidedMode: true,
    difficulty: 'easy',
    totalQuestions: 0,
    sessionStartTime: Date.now(),
    gameErrors: []
  })
  const [savingScore, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [latestSessionRisk, setLatestSessionRisk] = useState<{ risk: string; risk_score?: number } | null>(null)
  const guidedReadActiveRef = useRef(false)
  const guidedReadTimerRef = useRef<number | null>(null)

  const passages: Passage[] = [
    {
      level: 1,
      text: "The cat sat on the mat. It was a big, fluffy cat. The cat liked to sleep in the sun.",
      questions: [
        { question: "Where did the cat sit?", options: ["on the chair", "on the mat", "on the bed"], correct: 1 },
        { question: "What did the cat like to do?", options: ["play", "eat", "sleep in the sun"], correct: 2 }
      ]
    },
    {
      level: 2,
      text: "Sarah went to the park with her dog Max. They played fetch with a red ball. Max ran very fast to catch the ball. Sarah was happy to see Max having fun.",
      questions: [
        { question: "Who went to the park?", options: ["Sarah and Max", "Just Sarah", "Just Max"], correct: 0 },
        { question: "What color was the ball?", options: ["blue", "green", "red"], correct: 2 },
        { question: "How did Max run?", options: ["slowly", "very fast", "carefully"], correct: 1 }
      ]
    },
    {
      level: 3,
      text: "The library was quiet and peaceful. Emma loved reading books about adventures. She found a book about pirates and treasure. The story was exciting and made her want to explore new places.",
      questions: [
        { question: "What was the library like?", options: ["noisy", "quiet and peaceful", "crowded"], correct: 1 },
        { question: "What kind of books did Emma love?", options: ["adventure books", "cooking books", "science books"], correct: 0 },
        { question: "How did the story make Emma feel?", options: ["bored", "sleepy", "want to explore"], correct: 2 }
      ]
    }
  ]

  const maxRounds = gameState.difficulty === 'easy' ? 4 : gameState.difficulty === 'medium' ? 6 : 9

  const generateRound = () => {
    if (!user) return
    
    const difficulty = getAdaptiveDifficulty(user.email, 'readingComprehension')
    const availablePassages = passages.filter(p => p.level <= difficulty.level + 1)
    const passage = availablePassages[Math.floor(Math.random() * availablePassages.length)]
    
    setGameState(prev => ({
      ...prev,
      currentPassage: passage,
      currentQuestion: 0,
      selectedAnswers: new Array(passage.questions.length).fill(null),
      feedback: '',
      currentWordIndex: -1,
      startTime: Date.now(),
      guidedMode: DIFFICULTY_SETTINGS[gameState.difficulty].hintsEnabled && difficulty.hintsEnabled
    }))
  }

  const stopGuidedReading = () => {
    guidedReadActiveRef.current = false
    if (guidedReadTimerRef.current) {
      window.clearTimeout(guidedReadTimerRef.current)
      guidedReadTimerRef.current = null
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setGameState(prev => ({ ...prev, isReading: false, currentWordIndex: -1 }))
    console.log('Guided reading paused')
  }

  const startGuidedReading = () => {
    if (!gameState.currentPassage) return
    if (gameState.isReading) {
      stopGuidedReading()
      return
    }
    
    guidedReadActiveRef.current = true
    setGameState(prev => ({ ...prev, isReading: true, currentWordIndex: 0 }))
    
    const words = gameState.currentPassage.text.split(' ')
    let wordIndex = 0
    
    const readWord = () => {
      if (!guidedReadActiveRef.current) return
      if (wordIndex < words.length) {
        setGameState(prev => ({ ...prev, currentWordIndex: wordIndex }))
        speakText(words[wordIndex], 0.8)
        wordIndex++
        guidedReadTimerRef.current = window.setTimeout(readWord, 800)
      } else {
        guidedReadActiveRef.current = false
        guidedReadTimerRef.current = null
        setGameState(prev => ({ ...prev, isReading: false, currentWordIndex: -1 }))
      }
    }
    
    readWord()
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...gameState.selectedAnswers]
    newAnswers[questionIndex] = answerIndex
    setGameState(prev => ({ ...prev, selectedAnswers: newAnswers }))
  }

  const submitAnswers = () => {
    if (!gameState.currentPassage || !user) return
    
    const correctAnswers = gameState.selectedAnswers.filter((answer, index) => 
      answer === gameState.currentPassage!.questions[index].correct
    ).length
    const wrongAnswers = gameState.currentPassage.questions
      .map((question, index) => {
        const selectedIndex = gameState.selectedAnswers[index]
        if (selectedIndex === question.correct || selectedIndex === null) {
          return null
        }
        return {
          expected: question.options[question.correct],
          actual: question.options[selectedIndex] ?? 'No answer',
        }
      })
      .filter((item): item is { expected: string; actual: string } => item !== null)
    
    const accuracy = correctAnswers / gameState.currentPassage.questions.length
    const reactionTime = Date.now() - gameState.startTime
    const readingSpeed = (gameState.currentPassage.text.split(' ').length / (reactionTime / 1000)) * 60 // WPM
    
    const profile = updateGameProgress(user.email, 'readingComprehension', {
      accuracy,
      reactionTime,
      difficulty: gameState.currentPassage.level,
      timestamp: Date.now()
    })

    setGameState(prev => ({
      ...prev,
      totalQuestions: prev.totalQuestions + gameState.currentPassage!.questions.length,
      gameErrors: [...prev.gameErrors, ...wrongAnswers]
    }))
    
    const recentAccuracy = profile.readingComprehension.averageAccuracy
    const isImprovement = profile.readingComprehension.attempts.length > 1 && 
      accuracy > profile.readingComprehension.attempts[profile.readingComprehension.attempts.length - 2].accuracy
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + correctAnswers * DIFFICULTY_SETTINGS[gameState.difficulty].scoreMultiplier,
      readingSpeed,
      feedback: getEncouragingMessage(recentAccuracy, isImprovement)
    }))
    
    setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 3000)
  }

  const resetGame = () => {
    setGameState({
      currentPassage: null,
      currentQuestion: 0,
      selectedAnswers: [],
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      isReading: false,
      currentWordIndex: -1,
      startTime: 0,
      readingSpeed: 0,
      guidedMode: true,
      difficulty: 'easy',
      totalQuestions: 0,
      sessionStartTime: Date.now(),
      gameErrors: []
    })
    setHasStarted(false)
  }

  useEffect(() => {
    if (!hasStarted) return
    generateRound()
    return () => {
      stopGuidedReading()
    }
  }, [user, hasStarted])

  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      difficulty: selectedDifficulty,
      totalQuestions: 0,
      sessionStartTime: Date.now(),
      gameErrors: []
    }))
    setScoreSaved(false)
    setHasStarted(true)
    window.setTimeout(() => generateRound(), 0)
  }

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'reading_comprehension',
          difficulty: gameState.difficulty.toString(),
          accuracy: gameState.totalQuestions ? gameState.score / gameState.totalQuestions : 0,
          avgResponseTime: (Date.now() - gameState.sessionStartTime) / Math.max(1, gameState.round),
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save reading comprehension score:', error)
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.totalQuestions, gameState.difficulty, gameState.sessionStartTime, gameState.round])

  useEffect(() => {
    const loadLatestSessionRisk = async () => {
      if (!gameState.gameOver || !user) return
      try {
        const response = await fetch(`http://localhost:5000/api/dyslexia/sessions/${String(user.id)}`)
        if (!response.ok) return
        const data = await response.json()
        const latest = data?.latest
        if (latest) {
          setLatestSessionRisk({
            risk: latest.risk || 'Unknown',
            risk_score: typeof latest.risk_score === 'number' ? latest.risk_score : undefined,
          })
        }
      } catch (error) {
        console.warn('Unable to fetch latest dyslexia risk:', error)
      }
    }
    void loadLatestSessionRisk()
  }, [gameState.gameOver, user])

  if (gameState.gameOver) {
    const profile = user ? getLearningProfile(user.email) : null
    const badges = profile?.readingComprehension.badges || []
    
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div 
          className="card p-8 text-center max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Reading Session Complete!</h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600 dark:text-gray-300">Score: {gameState.score} correct answers</p>
            <p className="text-gray-600 dark:text-gray-300">
              Accuracy: {Math.round((gameState.totalQuestions > 0 ? gameState.score / gameState.totalQuestions : 0) * 100)}%
            </p>
            <p className="text-gray-600 dark:text-gray-300">Reading Speed: {gameState.readingSpeed.toFixed(0)} WPM</p>
            <p className="text-gray-600 dark:text-gray-300">
              Risk Level: {latestSessionRisk?.risk || 'Pending'}
              {typeof latestSessionRisk?.risk_score === 'number' ? ` (${latestSessionRisk.risk_score.toFixed(2)})` : ''}
            </p>
            {badges.length > 0 && (
              <div className="flex justify-center space-x-2 mt-4">
                {badges.map(badge => (
                  <div key={badge} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    📚 {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                console.log('Session Completed')
                resetGame()
              }}
              className="btn btn-primary w-full"
            >
              Continue Playing
            </button>
            <button onClick={() => navigate('/games')} className="btn btn-outline w-full">
              Other Games
            </button>
            <button onClick={() => navigate('/profile')} className="btn btn-outline w-full">
              View Profile
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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

  if (!gameState.currentPassage) {
    return (
      <div className="min-h-screen gradient-bg px-4 py-6">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 items-start">
          <div className="w-full xl:flex-1 max-w-5xl mx-auto xl:mx-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading passage...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const words = gameState.currentPassage.text.split(' ')
  const allAnswered = gameState.selectedAnswers.every(answer => answer !== null)

  return (
    <div className="min-h-screen gradient-bg px-4 py-6">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:flex-1 max-w-5xl mx-auto xl:mx-0">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-center sm:text-left">Reading Comprehension Learning</h1>
            <div className="flex items-center justify-center sm:justify-end space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Round {gameState.round}/{maxRounds}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score} correct</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Passage */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Reading Passage</h3>
            <div className="flex flex-wrap gap-2">
              {gameState.guidedMode && (
                <button 
                  onClick={startGuidedReading}
                  disabled={gameState.isReading}
                  className="btn btn-outline btn-sm"
                >
                  {gameState.isReading ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Reading...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Guided Reading
                    </>
                  )}
                </button>
              )}
              <button 
                onClick={() => speakText(gameState.currentPassage.text)}
                className="btn btn-ghost btn-sm"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Read Aloud
              </button>
            </div>
          </div>
          
          <div className="text-lg leading-relaxed p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg">
            {words.map((word, index) => (
              <span
                key={index}
                className={`${
                  gameState.currentWordIndex === index 
                    ? 'bg-yellow-200 font-semibold' 
                    : ''
                } mr-1`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Comprehension Questions</h3>
          
          <div className="space-y-6">
            {gameState.currentPassage.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b border-gray-200 pb-4 last:border-b-0">
                <p className="font-medium mb-3">{qIndex + 1}. {question.question}</p>
                <div className="grid grid-cols-1 gap-2">
                  {question.options.map((option, oIndex) => (
                    <motion.button
                      key={oIndex}
                      onClick={() => handleAnswerSelect(qIndex, oIndex)}
                      className={`
                        w-full min-h-[2.75rem] text-left p-3 rounded-lg border transition-all
                        ${gameState.selectedAnswers[qIndex] === oIndex
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-300'
                        }
                      `}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {String.fromCharCode(65 + oIndex)}. {option}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <button 
              onClick={submitAnswers}
              disabled={!allAnswered}
              className="btn btn-primary"
            >
              Submit Answers
            </button>
          </div>
          
          {gameState.feedback && (
            <motion.div 
              className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-center font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {gameState.feedback}
              {gameState.readingSpeed > 0 && (
                <div className="text-sm mt-2">
                  Reading Speed: {gameState.readingSpeed.toFixed(0)} words per minute
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="card p-4 mt-6">
          <h4 className="font-semibold text-sm mb-2">Difficulty Level:</h4>
          <div className="flex space-x-2">
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
        </div>
      </div>
      
      <div className="w-full xl:w-96 xl:flex-shrink-0 mx-auto xl:mx-0">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="reading-comprehension"
          difficulty={gameState.difficulty}
          totalQuestions={Math.max(1, gameState.totalQuestions)}
          isGamePage={true}
          errors={gameState.gameErrors}
        />
      </div>
      </div>
    </div>
  )
}

export default ReadingComprehensionLearning