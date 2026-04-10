import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Target, Volume2, Star, Zap, Brain, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import InteractiveButton from '../ui/InteractiveButton'
import AnimatedCard from '../ui/AnimatedCard'
import ProgressBar from '../ui/ProgressBar'
import { playSuccessSound, playErrorSound, createParticles, shakeElement } from '../../lib/gameEffects'
import { motion, AnimatePresence } from 'framer-motion'
import { getAdaptiveDifficulty, getNextLevel } from '../../utils/adaptiveEngine'
import { useAdaptiveEngine } from '../../hooks/UseAdaptiveEngine'
import NeurologicalInsights from '../ui/NeurologicalInsights'
import { analyzeGamePerformance, logMistakeWithTags } from '../../services/neurologicalService'
import { dispatchGameResultUpdate } from '../../lib/localStorageEvents'

interface WordRecognitionGameProps {
  onGameComplete?: (score: number) => void
}

const WordRecognitionGame: React.FC<WordRecognitionGameProps> = ({ onGameComplete }) => {
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
  const [showFeedback, setShowFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [roundStartTime, setRoundStartTime] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [neurologicalAnalysis, setNeurologicalAnalysis] = useState<any>(null)
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<any>(null)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [attemptId, setAttemptId] = useState<string>('')
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const { difficulty, onLevelEnd, loading: adaptiveLoading } = useAdaptiveEngine(1)
  const wordDisplayRef = useRef<HTMLDivElement>(null)
  
  const gameConfig = gameConfigs['word-recognition']

  // Enhanced word sets with phonological patterns
  const mirrorLetterMap: Record<string, string> = {
    'b': 'd', 'd': 'b',
    'p': 'q', 'q': 'p',
    'm': 'w', 'w': 'm',
    'n': 'u', 'u': 'n'
  }

  const createMirrorDistractor = (word: string): string => {
    const letters = word.split('')
    const mirrorEligible = letters
      .map((l, i) => ({ letter: l, index: i }))
      .filter(({ letter }) => mirrorLetterMap[letter.toLowerCase()])
    
    if (mirrorEligible.length === 0) return word
    
    const toReplace = mirrorEligible[Math.floor(Math.random() * mirrorEligible.length)]
    const mirrored = mirrorLetterMap[toReplace.letter.toLowerCase()]
    letters[toReplace.index] = toReplace.letter === toReplace.letter.toUpperCase() 
      ? mirrored.toUpperCase() 
      : mirrored
    
    return letters.join('')
  }

  const wordSets = {
    beginner: {
      words: ['cat', 'dog', 'sun', 'car', 'run', 'big', 'red', 'hat', 'cup', 'pen', 'bat', 'man', 'box', 'toy', 'bee', 'bed', 'den', 'pod', 'nod'],
      distractors: ['cap', 'dig', 'son', 'cut', 'ran', 'bag', 'rod', 'hit', 'cop', 'pin', 'dud', 'wan', 'pox', 'coy', 'gee', 'bet', 'uen', 'bod', 'mod']
    },
    easy: {
      words: ['house', 'water', 'happy', 'green', 'table', 'phone', 'smile', 'paper', 'light', 'music', 'blind', 'pound', 'blend', 'under'],
      distractors: ['horse', 'winter', 'hoppy', 'grain', 'cable', 'prone', 'small', 'pepper', 'night', 'magic', 'blund', 'pounb', 'dlend', 'unber']
    },
    moderate: {
      words: ['elephant', 'beautiful', 'computer', 'vacation', 'chemistry', 'telephone', 'paragraph', 'wonderful', 'bundle', 'boundary'],
      distractors: ['elegant', 'beatiful', 'competer', 'vocation', 'chemestry', 'telefone', 'paragrph', 'wonderfol', 'bpndle', 'boindary']
    },
    hard: {
      words: ['extraordinary', 'sophisticated', 'revolutionary', 'incomprehensible', 'pharmaceutical', 'archaeological', 'profound', 'database'],
      distractors: ['extraodinary', 'sofisticated', 'revolusionary', 'incomprehensable', 'farmaceutical', 'archeological', 'profounb', 'databade']
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
    } else if (timeLeft === 0) {
      handleTimeOut()
    }
  }, [timeLeft, gameStarted, currentRound, selectedLevel])

  useEffect(() => {
    if (gameStarted) {
      setAttemptId(`attempt_${Date.now()}_${user?.id || 'anonymous'}`)
    }
  }, [gameStarted, user])

  const startGame = async (level: GameLevel) => {
    setSelectedLevel(level)
    setGameStarted(true)
    setUsedWords([])
    setGameStartTime(Date.now())
    
    // Get adaptive difficulty if user is logged in
    if (user?.id) {
      try {
        const adaptiveDiff = await getAdaptiveDifficulty('word_recognition', user.id)
        console.log('Adaptive difficulty:', adaptiveDiff)
      } catch (error) {
        console.error('Failed to get adaptive difficulty:', error)
      }
    }
    
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
    
    // Create phonologically similar distractors
    const distractors = wordSet.distractors
      .filter(d => d !== correctWord)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    
    // Add one random word from the same set
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
      
      // Log mistake for neurological analysis
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
      
      const messages = [
        '🎉 Excellent!',
        '⭐ Perfect!',
        '🚀 Amazing!',
        '💫 Brilliant!',
        '🎯 Spot on!'
      ]
      
      let message = messages[Math.floor(Math.random() * messages.length)]
      if (newStreak >= 3) message += ` ${newStreak} in a row! 🔥`
      
      setShowFeedback({ type: 'success', message })
      toast.success(message)
    } else {
      setStreak(0)
      playErrorSound()
      
      if (wordDisplayRef.current) {
        shakeElement(wordDisplayRef.current)
      }
      
      const message = `❌ Try again! The word was "${currentWord}"`
      setShowFeedback({ type: 'error', message })
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
    setShowFeedback({ type: 'error', message })
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
        // Enhanced neurological analysis
        const analysis = await analyzeGamePerformance({
          userId: user.id,
          game: 'word_recognition',
          score: accuracy,
          timeTaken: avgResponseTime,
          mistakes: errors
        })
        
        setNeurologicalAnalysis(analysis)
        
        // Use adaptive engine
        const result = await onLevelEnd({
          gameName: 'word_recognition',
          accuracy,
          avgResponseTime,
          errors,
          userId: user.id
        })
        
        setAdaptiveRecommendation(result)
      }
    } catch (err) {
      console.error("Failed to complete analysis:", err)
    }
    
    const result = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      username: user?.email?.split('@')[0] || 'Anonymous',
      gameType: 'word-recognition',
      gameName: 'Word Recognition',
      difficulty: selectedLevel.difficulty,
      level: selectedLevel.name,
      score: score,
      totalQuestions: selectedLevel.questionsCount,
      accuracy: accuracy,
      avgResponseTime: avgResponseTime,
      responseTimes: responseTimes,
      hasDyslexia: score < selectedLevel.passingScore,
      completedAt: new Date().toISOString(),
      durationSeconds: gameDurationSeconds,
      neurologicalIndicators: neurologicalAnalysis?.dyslexiaIndicators || [],
      riskLevel: neurologicalAnalysis?.riskLevel || 'low'
    }
    
    const results = JSON.parse(localStorage.getItem('gameResults') || '[]')
    results.push(result)
    localStorage.setItem('gameResults', JSON.stringify(results))
    
    dispatchGameResultUpdate()
    
    const passed = score >= selectedLevel.passingScore
    toast.success(`Game Complete! You scored ${score}/${selectedLevel.questionsCount}`, {
      description: passed ? 'Great job!' : 'Keep practicing to improve!'
    })
    
    if (onGameComplete) {
      onGameComplete(score)
    }
  }

  const handleBack = () => {
    navigate('/games')
  }

  const restartGame = () => {
    if (!selectedLevel) return
    setCurrentRound(0)
    setScore(0)
    setStreak(0)
    setGameComplete(false)
    setUsedWords([])
    setErrors({})
    setResponseTimes([])
    setShowFeedback(null)
    setTimeLeft(selectedLevel.timeLimit || 10)
    setGameStartTime(Date.now())
    generateQuestion(selectedLevel)
    console.log('WordRecognitionGame restarted')
  }

  if (!selectedLevel) {
    return (
      <LevelSelector
        gameTitle={gameConfig.title}
        gameDescription={gameConfig.description}
        levels={gameConfig.levels}
        onLevelSelect={startGame}
        onBack={handleBack}
      />
    )
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen gradient-bg p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedCard className="p-8 text-center">
            <motion.h1 
              className="text-3xl font-bold mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              🎉 Game Complete!
            </motion.h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Results Section */}
              <div>
                <motion.div 
                  className="text-6xl font-bold text-primary-600 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {score}/{selectedLevel.questionsCount}
                </motion.div>
                <p className="text-xl text-gray-600 mb-4">
                  Accuracy: {Math.round((score / selectedLevel.questionsCount) * 100)}%
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Level:</span> {selectedLevel.name}
                    </div>
                    <div>
                      <span className="font-semibold">Avg Response:</span> {(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)}s
                    </div>
                    <div>
                      <span className="font-semibold">Best Streak:</span> {Math.max(...responseTimes.map((_, i) => streak))}
                    </div>
                    <div>
                      <span className="font-semibold">Errors:</span> {Object.keys(errors).length}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <InteractiveButton onClick={restartGame} variant="primary" particles={true}>
                    Play Again
                  </InteractiveButton>
                  <InteractiveButton 
                    onClick={handleBack}
                    variant="outline"
                  >
                    Back to Games
                  </InteractiveButton>
                </div>
              </div>

              {/* Analysis Section */}
              <div className="text-left">
                {neurologicalAnalysis && (
                  <NeurologicalInsights
                    indicators={neurologicalAnalysis.dyslexiaIndicators || []}
                    riskLevel={neurologicalAnalysis.riskLevel || 'low'}
                    gameName="word_recognition"
                    accuracy={(score / selectedLevel.questionsCount) * 100}
                    tags={neurologicalAnalysis.neurologicalTags}
                    patterns={neurologicalAnalysis.patterns}
                    mlAnalysis={neurologicalAnalysis.mlAnalysis}
                  />
                )}
                
                {adaptiveRecommendation && (
                  <motion.div 
                    className="mt-4 p-4 bg-blue-50 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      🎯 Next Level Recommendation
                    </h3>
                    <p className="text-blue-700">
                      <strong>Suggested Difficulty:</strong> Level {adaptiveRecommendation.next || difficulty}
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      {adaptiveRecommendation.reason}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <AnimatedCard className="mb-6 p-6" delay={0.2}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <motion.h1 
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Word Recognition - {selectedLevel.name}
            </motion.h1>
            <div className="text-right">
              <motion.div 
                className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="text-center">
                  <p className="text-sm text-gray-600">Round</p>
                  <p className="text-lg font-bold">{currentRound + 1}/{selectedLevel.questionsCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-lg font-bold text-green-600">{score}</p>
                </div>
                {streak >= 2 && (
                  <motion.div 
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <p className="text-sm text-gray-600">Streak</p>
                    <p className="text-lg font-bold text-orange-500 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />{streak}
                    </p>
                  </motion.div>
                )}
                {difficulty > 1 && (
                  <motion.div 
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <p className="text-sm text-gray-600">AI Level</p>
                    <p className="text-lg font-bold text-purple-500 flex items-center">
                      <Brain className="w-4 h-4 mr-1" />{difficulty}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
          
          <ProgressBar 
            progress={currentRound} 
            total={selectedLevel.questionsCount} 
            className="mb-4"
          />
          
          <motion.div 
            className="flex items-center justify-center text-sm text-gray-600"
            animate={{ 
              color: timeLeft <= 3 ? '#EF4444' : '#6B7280',
              scale: timeLeft <= 3 ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
          >
            <Clock className="w-4 h-4 mr-1" />
            Time left: {timeLeft}s
          </motion.div>
        </AnimatedCard>

        <AnimatedCard className="p-4 sm:p-8 text-center relative overflow-hidden" delay={0.4}>
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                className={`absolute inset-0 flex items-center justify-center z-10 ${
                  showFeedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } bg-opacity-90 text-white`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <motion.div
                    className="text-4xl mb-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {showFeedback.type === 'success' ? '🎉' : '😅'}
                  </motion.div>
                  <p className="text-xl font-bold">{showFeedback.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-xl sm:text-2xl font-bold mb-4">Which word matches the sound?</h2>
          
          <InteractiveButton
            onClick={() => playWordSound(currentWord)}
            className="mb-8 mx-auto flex items-center gap-2"
            variant="primary"
            particles={true}
          >
            <Volume2 className="w-5 h-5" />
            Play Sound Again
          </InteractiveButton>
          
          <motion.div 
            ref={wordDisplayRef}
            className="text-3xl sm:text-5xl font-bold mb-8 sm:mb-12 text-primary-600 p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200 shadow-lg relative font-dyslexic break-words"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {currentWord}
            {streak >= 3 && (
              <motion.div
                className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                🔥
              </motion.div>
            )}
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
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
                    className="w-full min-h-[3rem] sm:h-16 text-base sm:text-lg font-dyslexic"
                    variant="outline"
                    particles={true}
                  >
                    {option}
                  </InteractiveButton>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}

export default WordRecognitionGame