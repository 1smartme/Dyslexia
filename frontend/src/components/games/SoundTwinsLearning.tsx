import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Star, Trophy, Lightbulb, RotateCcw, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { playSuccessSound, playErrorSound } from '../../lib/gameEffects'
import { DIFFICULTY_SETTINGS, getGameContent, pickConfusingWord } from '../../data/difficultySystem'

interface GameState {
  currentPair: { sound1: string; sound2: string; areSame: boolean }
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHint: boolean
  level: number
  timeLeft: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const SoundTwinsLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    currentPair: { sound1: '', sound2: '', areSame: false },
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHint: false,
    level: 1,
    timeLeft: 12,
    difficulty: 'easy'
  })
  const [, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const buildSoundPairs = (difficulty: 'easy' | 'medium' | 'hard') => {
    const words = getGameContent(difficulty, difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 8).map(item => item.word)
    const samePairs = words.slice(0, Math.max(2, Math.floor(words.length / 2))).map(word => ({
      sound1: word,
      sound2: word,
      areSame: true
    }))
    const differentPairs = words.slice(Math.max(2, Math.floor(words.length / 2))).map(word => {
      const confusing = difficulty === 'hard' ? pickConfusingWord(word) : null
      const fallback = words[Math.floor(Math.random() * words.length)]
      return {
        sound1: word,
        sound2: confusing || fallback,
        areSame: false
      }
    })
    return [...samePairs, ...differentPairs]
  }

  const difficultyConfig = {
    easy: { rounds: DIFFICULTY_SETTINGS.easy.rounds, time: DIFFICULTY_SETTINGS.easy.time, multiplier: DIFFICULTY_SETTINGS.easy.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.easy.hintsEnabled },
    medium: { rounds: DIFFICULTY_SETTINGS.medium.rounds, time: DIFFICULTY_SETTINGS.medium.time, multiplier: DIFFICULTY_SETTINGS.medium.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.medium.hintsEnabled },
    hard: { rounds: DIFFICULTY_SETTINGS.hard.rounds, time: DIFFICULTY_SETTINGS.hard.time, multiplier: DIFFICULTY_SETTINGS.hard.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.hard.hintsEnabled }
  } as const

  const maxRounds = difficultyConfig[gameState.difficulty].rounds

  const generateRound = (selectedDifficulty = gameState.difficulty) => {
    if (!user) return
    
    const difficulty = getAdaptiveDifficulty(user.email, 'wordRecognition')
    const pairPool = buildSoundPairs(selectedDifficulty)
    const randomPair = pairPool[Math.floor(Math.random() * pairPool.length)]
    
    setGameState(prev => ({
      ...prev,
      currentPair: randomPair,
      feedback: '',
      showHint: false,
      level: difficulty.level,
      timeLeft: difficultyConfig[selectedDifficulty].time
    }))
  }

  const playSequence = () => {
    speakText(gameState.currentPair.sound1, 0.7)
    setTimeout(() => {
      speakText(gameState.currentPair.sound2, 0.7)
    }, 1500)
  }

  const handleAnswer = (userAnswer: boolean) => {
    const isCorrect = userAnswer === gameState.currentPair.areSame
    const accuracy = isCorrect ? 1 : 0
    
    if (user) {
      updateGameProgress(user.email, 'wordRecognition', {
        accuracy,
        reactionTime: 1000,
        difficulty: gameState.level,
        timestamp: Date.now()
      })
    }

    const scoreDelta = isCorrect ? difficultyConfig[gameState.difficulty].multiplier : 0
    setGameState(prev => ({
      ...prev,
      score: prev.score + scoreDelta,
      feedback: getEncouragingMessage(accuracy, true)
    }))

    if (isCorrect) {
      playSuccessSound()
    } else {
      playErrorSound()
    }

    setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 2000)
  }

  const showHint = () => {
    if (!difficultyConfig[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    setGameState(prev => ({ ...prev, showHint: true }))
    speakText(`Listen carefully. First word: ${gameState.currentPair.sound1}. Second word: ${gameState.currentPair.sound2}. Are they the same?`)
  }

  const resetGame = () => {
    setGameState({
      currentPair: { sound1: '', sound2: '', areSame: false },
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHint: false,
      level: 1,
      timeLeft: 12,
      difficulty: 'easy'
    })
    setScoreSaved(false)
    setHasStarted(false)
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
      showHint: false,
      difficulty: selectedDifficulty
    }))
    setScoreSaved(false)
    setHasStarted(true)
    window.setTimeout(() => generateRound(selectedDifficulty), 0)
  }

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'sound_twins',
          difficulty: gameState.level.toString(),
          accuracy: Math.min(1, gameState.score / maxRounds),
          avgResponseTime: 0,
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save sound twins score:', error)
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.level])

  useEffect(() => {
    if (gameState.currentPair.sound1 && !gameState.feedback) {
      setTimeout(() => playSequence(), 500)
    }
  }, [gameState.currentPair])

  useEffect(() => {
    if (gameState.gameOver || !!gameState.feedback || gameState.timeLeft <= 0 || !gameState.currentPair.sound1) return
    const timer = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [gameState.gameOver, gameState.feedback, gameState.timeLeft, gameState.currentPair.sound1])

  useEffect(() => {
    if (gameState.gameOver || gameState.timeLeft > 0 || !gameState.currentPair.sound1) return
    playErrorSound()
    setGameState(prev => ({ ...prev, feedback: "⏰ Time's up! Let's try the next pair." }))
    const timeout = window.setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound(gameState.difficulty)
      }
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [gameState.timeLeft, gameState.gameOver, gameState.round, gameState.currentPair.sound1, gameState.difficulty])

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Volume2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sound Learning Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Score: {gameState.score}/{maxRounds} • Level: {gameState.level}</p>
          <button onClick={resetGame} className="btn btn-primary w-full">Continue Learning</button>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Volume2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Sound Twins Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score}/{maxRounds}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                <span className="font-semibold">{gameState.timeLeft}s</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">Round {gameState.round} of {maxRounds}</p>
            <p className="text-lg font-semibold text-primary-600">Listen and decide: Same or Different?</p>
            <div className="flex justify-center gap-2 mt-3">
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setGameState(prev => ({ ...prev, difficulty: diff }))}
                  className={`btn btn-sm ${gameState.difficulty === diff ? 'btn-primary' : 'btn-outline'}`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-8 mb-6">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 min-w-[120px]">
                <Volume2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{gameState.currentPair.sound1}</div>
              </div>
              
              <div className="text-2xl font-bold text-gray-400">vs</div>
              
              <div className="bg-purple-50 rounded-lg p-6 min-w-[120px]">
                <Volume2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{gameState.currentPair.sound2}</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mb-6">
              <button onClick={playSequence} className="btn btn-outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </button>
              <button onClick={showHint} className="btn btn-ghost">
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-2 gap-6">
            <motion.button
              onClick={() => handleAnswer(true)}
              className="btn btn-success btn-lg h-20 text-xl"
              whileHover={{ scale: 1.02 }}
              disabled={!!gameState.feedback}
            >
              Same
            </motion.button>
            
            <motion.button
              onClick={() => handleAnswer(false)}
              className="btn btn-danger btn-lg h-20 text-xl"
              whileHover={{ scale: 1.02 }}
              disabled={!!gameState.feedback}
            >
              Different
            </motion.button>
          </div>
          
          {gameState.showHint && (
            <motion.div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center">
              💡 Listen to the sounds carefully. Focus on how each word begins and ends.
            </motion.div>
          )}
          
          {gameState.feedback && (
            <motion.div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold">
              {gameState.feedback}
              <div className="text-sm mt-2">
                The sounds were: {gameState.currentPair.areSame ? 'Same' : 'Different'}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="w-96 flex-shrink-0">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="sound-twins"
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

export default SoundTwinsLearning