import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import GameShell from './GameShell'
import { GameContent, GameSection, AnswerGrid, FeedbackOverlay } from './GameComponents'
import InteractiveButton from '../ui/InteractiveButton'
//import AnimatedCard from '../ui/AnimatedCard'
import NeurologicalInsights from '../ui/NeurologicalInsights'
import { playSuccessSound, playErrorSound, createParticles, shakeElement } from '../../lib/gameEffects'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdaptiveEngine } from '../../hooks/UseAdaptiveEngine'
import { analyzeGamePerformance, logMistakeWithTags } from '../../services/neurologicalService'
import { saveGameScore } from '../../services/gamesService'

interface WordRecognitionGameProps {
  onGameComplete?: (score: number) => void
}

const WordRecognitionGameRefactored: React.FC<WordRecognitionGameProps> = ({ onGameComplete }) => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(10)
  const [gameComplete, setGameComplete] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [streak, setStreak] = useState(0)
  const [showFeedback, setShowFeedback] = useState<{ type: 'success' | 'error'; message: string; emoji: string } | null>(null)
  const [roundStartTime, setRoundStartTime] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [neurologicalAnalysis, setNeurologicalAnalysis] = useState<any>(null)
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<any>(null)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [attemptId, setAttemptId] = useState<string>('')

  const { user } = useAuth()
  const navigate = useNavigate()
  const { difficulty, onLevelEnd } = useAdaptiveEngine(1)
  const wordDisplayRef = useRef<HTMLDivElement>(null)

  const gameConfig = gameConfigs['word-recognition']

  const wordSets = {
    beginner: {
      words: ['cat', 'dog', 'sun', 'car', 'run', 'big', 'red', 'hat', 'cup', 'pen', 'bat', 'man', 'box', 'toy', 'bee'],
      distractors: ['cap', 'dig', 'son', 'cut', 'ran', 'bag', 'rod', 'hit', 'cop', 'pin', 'dud', 'wan', 'pox', 'coy', 'gee']
    },
    easy: {
      words: ['house', 'water', 'happy', 'green', 'table', 'phone', 'smile', 'paper', 'light', 'music'],
      distractors: ['horse', 'winter', 'hoppy', 'grain', 'cable', 'prone', 'small', 'pepper', 'night', 'magic']
    },
    moderate: {
      words: ['elephant', 'beautiful', 'computer', 'vacation', 'chemistry', 'telephone', 'paragraph', 'wonderful'],
      distractors: ['elegant', 'beatiful', 'competer', 'vocation', 'chemestry', 'telefone', 'paragrph', 'wonderfol']
    },
    hard: {
      words: ['extraordinary', 'sophisticated', 'revolutionary', 'incomprehensible', 'pharmaceutical', 'archaeological'],
      distractors: ['extraodinary', 'sofisticated', 'revolusionary', 'incomprehensable', 'farmaceutical', 'archeological']
    }
  }

  const playWordSound = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (gameStarted && selectedLevel && currentRound < selectedLevel.questionsCount && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameStarted) {
      handleTimeOut()
    }
  }, [timeLeft, gameStarted, currentRound, selectedLevel])

  useEffect(() => {
    if (gameStarted) {
      setAttemptId(`attempt_${Date.now()}_${user?.id || 'anonymous'}`)
    }
  }, [gameStarted, user])

  const startGame = (level: GameLevel) => {
    setSelectedLevel(level)
    setGameStarted(true)
    setUsedWords([])
    setGameStartTime(Date.now())
    generateQuestion(level)
  }

  const generateQuestion = (level: GameLevel) => {
    const wordSet = wordSets[level.id as keyof typeof wordSets]
    const availableWords = wordSet.words.filter(word => !usedWords.includes(word))

    if (availableWords.length === 0) {
      setUsedWords([])
    }

    const wordsToUse = availableWords.length > 0 ? availableWords : wordSet.words
    const correctWord = wordsToUse[Math.floor(Math.random() * wordsToUse.length)]

    const distractors = wordSet.distractors
      .filter(d => d !== correctWord)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    const randomWord = wordSet.words
      .filter(w => w !== correctWord && !distractors.includes(w))
      .sort(() => Math.random() - 0.5)[0]

    const allOptions = [correctWord, ...distractors, randomWord].sort(() => Math.random() - 0.5)

    setCurrentWord(correctWord)
    setOptions(allOptions)
    setUsedWords(prev => [...prev, correctWord])
    setTimeLeft(level.timeLimit || 10)
    setRoundStartTime(Date.now())

    setTimeout(() => playWordSound(correctWord), 500)
  }

  const handleAnswer = async (selectedWord: string) => {
    const isCorrect = selectedWord === currentWord
    const responseTime = Date.now() - roundStartTime
    setResponseTimes(prev => [...prev, responseTime])

    if (!isCorrect) {
      const errorData = {
        expected: currentWord,
        actual: selectedWord,
        timeTaken: responseTime,
        round: currentRound + 1
      }
      setErrors(prev => ({ ...prev, [`q${currentRound + 1}`]: errorData }))

      if (user?.id && attemptId) {
        try {
          await logMistakeWithTags({
            attemptId,
            questionNo: currentRound + 1,
            expectedAnswer: currentWord,
            userAnswer: selectedWord,
            rawData: { timeTakenMs: responseTime, options }
          })
        } catch (error) {
          console.error('Failed to log mistake:', error)
        }
      }
    }

    if (isCorrect) {
      const newStreak = streak + 1
      setScore(score + 1)
      setStreak(newStreak)
      playSuccessSound()

      if (wordDisplayRef.current) {
        createParticles(wordDisplayRef.current, '#10B981')
      }

      const messages = ['🎉 Excellent!', '⭐ Perfect!', '🚀 Amazing!', '💫 Brilliant!', '🎯 Spot on!']
      let message = messages[Math.floor(Math.random() * messages.length)]
      if (newStreak >= 3) message += ` ${newStreak} in a row! 🔥`

      setShowFeedback({ type: 'success', message, emoji: '🎉' })
      toast.success(message)
    } else {
      setStreak(0)
      playErrorSound()

      if (wordDisplayRef.current) {
        shakeElement(wordDisplayRef.current)
      }

      const message = `❌ Try again! The word was "${currentWord}"`
      setShowFeedback({ type: 'error', message, emoji: '😅' })
      toast.error(message)
    }

    setTimeout(() => {
      setShowFeedback(null)
      handleNextRound()
    }, 1500)
  }

  const handleTimeOut = () => {
    const responseTime = Date.now() - roundStartTime
    setResponseTimes(prev => [...prev, responseTime])

    const errorData = {
      expected: currentWord,
      actual: 'timeout',
      timeTaken: responseTime,
      round: currentRound + 1
    }
    setErrors(prev => ({ ...prev, [`q${currentRound + 1}`]: errorData }))

    setStreak(0)
    playErrorSound()

    if (wordDisplayRef.current) {
      shakeElement(wordDisplayRef.current)
    }

    const message = `⏰ Time's up! The word was "${currentWord}"`
    setShowFeedback({ type: 'error', message, emoji: '⏰' })
    toast.error(message)

    setTimeout(() => {
      setShowFeedback(null)
      handleNextRound()
    }, 1500)
  }

  const handleNextRound = () => {
    if (!selectedLevel) return

    if (currentRound + 1 >= selectedLevel.questionsCount) {
      completeGame()
    } else {
      setCurrentRound(currentRound + 1)
      generateQuestion(selectedLevel)
    }
  }

  const completeGame = async () => {
    if (!selectedLevel) return

    setGameComplete(true)
    const gameEndTime = Date.now()
    const gameDurationSeconds = Math.floor((gameEndTime - gameStartTime) / 1000)
    const accuracy = (score / selectedLevel.questionsCount) * 100
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

    try {
      if (user?.id) {
        const analysis = await analyzeGamePerformance({
          userId: user.id,
          game: 'word_recognition',
          score: accuracy,
          timeTaken: avgResponseTime,
          mistakes: errors
        })
        setNeurologicalAnalysis(analysis)

        await saveGameScore({
          userId: user.id,
          gameName: 'word_recognition',
          difficulty: selectedLevel.difficulty,
          accuracy: accuracy / 100,
          avgResponseTime,
          errors
        })
      }

      if (onGameComplete) {
        onGameComplete(accuracy)
      }
    } catch (error) {
      console.error('Error completing game:', error)
    }
  }

  const handleReset = () => {
    setCurrentRound(0)
    setScore(0)
    setStreak(0)
    setErrors({})
    setNeurologicalAnalysis(null)
    setGameComplete(false)
    if (selectedLevel) {
      generateQuestion(selectedLevel)
    }
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  if (!selectedLevel || !gameStarted) {
    return <LevelSelector gameConfig={gameConfig} onSelectLevel={startGame} />
  }

  if (gameComplete) {
    return (
      <GameShell
        title="Word Recognition - Complete"
        round={selectedLevel.questionsCount}
        totalRounds={selectedLevel.questionsCount}
        score={score}
        onBack={handleBack}
      >
        <GameContent>
          <GameSection>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">
                {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
              </div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                Game Over!
              </h2>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                Final Score: {score}/{selectedLevel.questionsCount}
              </p>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                Accuracy: {accuracy.toFixed(1)}%
              </p>
            </motion.div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                Game Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg Response Time
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(avgResponseTime / 1000).toFixed(1)}s
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Errors
                  </p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {Object.keys(errors).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Best Streak
                  </p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {Math.max(...responseTimes.map((_, i) => (i === 0 ? 0 : streak)), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Level
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {selectedLevel.name}
                  </p>
                </div>
              </div>
            </div>

            {neurologicalAnalysis && (
              <div className="mb-8">
                <NeurologicalInsights
                  indicators={neurologicalAnalysis.dyslexiaIndicators || []}
                  riskLevel={neurologicalAnalysis.riskLevel || 'low'}
                  gameName="word_recognition"
                  accuracy={accuracy}
                  tags={neurologicalAnalysis.neurologicalTags}
                  patterns={neurologicalAnalysis.patterns}
                />
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <InteractiveButton onClick={handleReset} variant="success">
                Play Again
              </InteractiveButton>
              <InteractiveButton onClick={handleBack} variant="outline">
                Back to Dashboard
              </InteractiveButton>
            </div>
          </GameSection>
        </GameContent>
      </GameShell>
    )
  }

  const accuracy = (score / selectedLevel.questionsCount) * 100
  const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0

  return (
    <GameShell
      title="Word Recognition"
      round={currentRound + 1}
      totalRounds={selectedLevel.questionsCount}
      score={score}
      streak={streak}
      timeLeft={timeLeft}
      difficulty={difficulty}
      onBack={handleBack}
      showStreakBadge
      showDifficultyBadge
    >
      <FeedbackOverlay
        show={!!showFeedback}
        type={showFeedback?.type || 'info'}
        message={showFeedback?.message || ''}
        emoji={showFeedback?.emoji}
      />

      <GameContent centerContent>
        <GameSection title="Click the word you hear">
          <motion.button
            onClick={() => playWordSound(currentWord)}
            className="mb-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 hover:shadow-lg mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Volume2 className="w-5 h-5" />
            Play Sound
          </motion.button>

          <motion.div
            ref={wordDisplayRef}
            className="text-5xl md:text-6xl font-bold mb-12 text-center text-primary-600 dark:text-primary-400 p-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl border-2 border-primary-200 dark:border-primary-700 shadow-lg font-dyslexic"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {currentWord}
            {streak >= 3 && (
              <motion.div
                className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                🔥
              </motion.div>
            )}
          </motion.div>

          <AnswerGrid columns={2} gap="md">
            <AnimatePresence>
              {options.map((option, index) => (
                <motion.div
                  key={`${option}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InteractiveButton
                    onClick={() => handleAnswer(option)}
                    className="w-full text-lg py-4 font-dyslexic"
                    variant="outline"
                  >
                    {option}
                  </InteractiveButton>
                </motion.div>
              ))}
            </AnimatePresence>
          </AnswerGrid>
        </GameSection>
      </GameContent>
    </GameShell>
  )
}

export default WordRecognitionGameRefactored
