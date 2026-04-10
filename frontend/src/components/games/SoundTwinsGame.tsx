import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, CheckCircle, XCircle, Target, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import InteractiveButton from '../ui/InteractiveButton'
import AnimatedCard from '../ui/AnimatedCard'
import { playSuccessSound, playErrorSound, createParticles, createStickers } from '../../lib/gameEffects'
import { AnimatePresence } from 'framer-motion'
import { saveGameScore } from '../../services/gamesService'
import { useAuth } from '../../contexts/AuthContext'

interface GameState {
  currentPair: { sound1: string; sound2: string; areSame: boolean }
  score: number
  round: number
  gameOver: boolean
  feedback: string
  isPlaying: boolean
}

const SoundTwinsGame: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    currentPair: { sound1: '', sound2: '', areSame: false },
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    isPlaying: false
  })
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [roundStartTime, setRoundStartTime] = useState<number>(0)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const gameConfig = gameConfigs['sound-twins']

  const soundPairSets = {
    beginner: [
      { sound1: 'cat', sound2: 'cat', areSame: true },
      { sound1: 'dog', sound2: 'dog', areSame: true },
      { sound1: 'cat', sound2: 'dog', areSame: false },
      { sound1: 'ball', sound2: 'tree', areSame: false }
    ],
    easy: [
      { sound1: 'pen', sound2: 'ben', areSame: false },
      { sound1: 'cat', sound2: 'bat', areSame: false },
      { sound1: 'ship', sound2: 'chip', areSame: false },
      { sound1: 'pen', sound2: 'pen', areSame: true }
    ],
    moderate: [
      { sound1: 'rice', sound2: 'nice', areSame: false },
      { sound1: 'lake', sound2: 'cake', areSame: false },
      { sound1: 'moon', sound2: 'noon', areSame: false },
      { sound1: 'thin', sound2: 'fin', areSame: false }
    ],
    hard: [
      { sound1: 'ship', sound2: 'sheep', areSame: false },
      { sound1: 'beach', sound2: 'peach', areSame: false },
      { sound1: 'light', sound2: 'right', areSame: false },
      { sound1: 'three', sound2: 'free', areSame: false }
    ]
  }

  const generateRound = () => {
    if (!selectedLevel) return
    
    const pairs = soundPairSets[selectedLevel.id as keyof typeof soundPairSets]
    const randomPair = pairs[Math.floor(Math.random() * pairs.length)]
    setGameState(prev => ({
      ...prev,
      currentPair: randomPair,
      feedback: '',
      isPlaying: false
    }))
    setRoundStartTime(Date.now())
  }

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1
      speechSynthesis.speak(utterance)
    }
  }

  const playSequence = async () => {
    setGameState(prev => ({ ...prev, isPlaying: true }))
    
    playSound(gameState.currentPair.sound1)
    
    setTimeout(() => {
      playSound(gameState.currentPair.sound2)
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }))
      }, 1000)
    }, 1500)
  }

  const handleAnswer = (userAnswer: boolean) => {
    const isCorrect = userAnswer === gameState.currentPair.areSame
    const points = isCorrect ? 1 : 0
    const responseTime = Date.now() - roundStartTime
    
    if (!isCorrect) {
      setErrors(prev => ({ 
        ...prev, 
        [`${gameState.currentPair.sound1}_${gameState.currentPair.sound2}`]: userAnswer 
      }))
    }
    
    if (isCorrect) {
      playSuccessSound()
      const buttonElement = document.querySelector('.answer-buttons') as HTMLElement
      if (buttonElement) {
        createParticles(buttonElement, '#10B981')
        createStickers(buttonElement, 'success')
      }
    } else {
      playErrorSound()
      const buttonElement = document.querySelector('.answer-buttons') as HTMLElement
      if (buttonElement) {
        createStickers(buttonElement, 'error')
      }
    }
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      feedback: isCorrect ? '🎉 Perfect! Great listening!' : '😅 Try again! Listen carefully!'
    }))

    setTimeout(async () => {
      if (!selectedLevel) return
      
      if (gameState.round >= selectedLevel.questionsCount) {
        // Save score to backend
        const finalScore = gameState.score + points
        const accuracy = (finalScore / selectedLevel.questionsCount) * 100
        const avgResponseTime = responseTime
        
        if (user?.id) {
          setSaving(true)
          try {
            await saveGameScore({
              userId: String(user.id),
              gameName: 'sound_twins',
              difficulty: selectedLevel.difficulty,
              accuracy: accuracy / 100,
              avgResponseTime,
              errors,
              score: finalScore
            })
          } catch (err) {
            console.error("Failed to save score:", err)
          } finally {
            setSaving(false)
          }
        }
        
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 1500)
  }

  const resetGame = () => {
    setGameState({
      currentPair: { sound1: '', sound2: '', areSame: false },
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      isPlaying: false
    })
    generateRound()
  }

  const handleBack = () => {
    navigate('/games')
  }

  const startGame = (level: GameLevel) => {
    setSelectedLevel(level)
    generateRound()
  }

  useEffect(() => {
    if (selectedLevel && gameState.currentPair.sound1 && !gameState.feedback) {
      setTimeout(() => playSequence(), 500)
    }
  }, [gameState.currentPair, selectedLevel])

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

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div 
          className="card p-8 text-center max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Volume2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sound Challenge Complete!</h2>
          <p className="text-gray-600 mb-6">
            Final Score: {gameState.score}/{selectedLevel.questionsCount} ({((gameState.score/selectedLevel.questionsCount)*100).toFixed(0)}%)
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={resetGame} className="btn btn-primary">
              Play Again
            </button>
            <button onClick={handleBack} className="btn btn-outline">
              Back to Games
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-2xl mx-auto">
        <AnimatedCard className="p-6 mb-6" delay={0.2}>
          <div className="flex justify-between items-center mb-4">
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              🎧 Sound Twins - {selectedLevel.name}
            </motion.h1>
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center bg-gradient-to-r from-blue-100 to-indigo-200 px-3 py-1 rounded-full"
                animate={{ scale: gameState.score > 0 ? [1, 1.1, 1] : 1 }}
              >
                <Target className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-bold text-blue-700">{gameState.score}/{selectedLevel.questionsCount}</span>
              </motion.div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2 font-semibold">Round {gameState.round} of {selectedLevel.questionsCount}</p>
            <motion.p 
              className="text-lg font-semibold text-primary-600"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👂 Listen carefully and decide if the sounds are the same or different
            </motion.p>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-8 mb-6" delay={0.4}>
          <div className="text-center">
            <div className="flex justify-center items-center space-x-8 mb-8">
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 min-w-[140px] border-2 border-blue-200 shadow-lg"
                animate={gameState.isPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={gameState.isPlaying ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: gameState.isPlaying ? Infinity : 0 }}
                >
                  <Volume2 className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                </motion.div>
                <div className="text-2xl font-bold text-blue-700">
                  {gameState.currentPair.sound1}
                </div>
                <div className="text-xs text-blue-500 mt-1">🎤 Sound 1</div>
              </motion.div>
              
              <motion.div 
                className="text-3xl font-bold text-gray-400"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎵 vs 🎵
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 min-w-[140px] border-2 border-purple-200 shadow-lg"
                animate={gameState.isPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div
                  animate={gameState.isPlaying ? { rotate: -360 } : {}}
                  transition={{ duration: 1, repeat: gameState.isPlaying ? Infinity : 0 }}
                >
                  <Volume2 className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                </motion.div>
                <div className="text-2xl font-bold text-purple-700">
                  {gameState.currentPair.sound2}
                </div>
                <div className="text-xs text-purple-500 mt-1">🎤 Sound 2</div>
              </motion.div>
            </div>

            <InteractiveButton
              onClick={playSequence}
              disabled={gameState.isPlaying}
              className="mb-6"
              variant="primary"
              particles={true}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {gameState.isPlaying ? '🎧 Playing...' : '🔄 Play Again'}
            </InteractiveButton>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6 relative overflow-hidden" delay={0.6}>
          <AnimatePresence>
            {gameState.feedback && (
              <motion.div
                className={`absolute inset-0 flex items-center justify-center z-10 ${
                  gameState.feedback.includes('Perfect') ? 'bg-green-500' : 'bg-orange-500'
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
                    {gameState.feedback.includes('Perfect') ? '🎉' : '😅'}
                  </motion.div>
                  <p className="text-xl font-bold">{gameState.feedback}</p>
                  <div className="text-sm mt-2 opacity-90">
                    The sounds were: {gameState.currentPair.areSame ? '🔄 Same' : '✨ Different'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mb-6">
            <motion.p 
              className="text-xl font-semibold mb-4 text-gray-800"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🤔 Are these sounds the same or different?
            </motion.p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 answer-buttons">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <InteractiveButton
                onClick={() => handleAnswer(true)}
                className="w-full h-20 text-xl"
                variant="success"
                disabled={!!gameState.feedback}
                particles={true}
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                ✅ Same
              </InteractiveButton>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <InteractiveButton
                onClick={() => handleAnswer(false)}
                className="w-full h-20 text-xl"
                variant="danger"
                disabled={!!gameState.feedback}
                particles={true}
              >
                <XCircle className="w-6 h-6 mr-2" />
                ❌ Different
              </InteractiveButton>
            </motion.div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}

export default SoundTwinsGame