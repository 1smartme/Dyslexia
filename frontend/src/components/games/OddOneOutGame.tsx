import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import InteractiveButton from '../ui/InteractiveButton'
import AnimatedCard from '../ui/AnimatedCard'
import { playSuccessSound, playErrorSound, createParticles, createStickers, playLevelUpSound } from '../../lib/gameEffects'
import { useAdaptiveEngine } from '../../hooks/UseAdaptiveEngine'

interface GameState {
  words: string[]
  correctAnswer: number
  selectedWord: number | null
  score: number
  round: number
  gameOver: boolean
  feedback: string
  startTime: number
}

const OddOneOutGame: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    words: [],
    correctAnswer: -1,
    selectedWord: null,
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    startTime: 0
  })
  const [errors, setErrors] = useState<Record<string, any>>({})
  const navigate = useNavigate()
  const { onLevelEnd } = useAdaptiveEngine(1)
  const gameConfig = gameConfigs['odd-one-out-learning']

  const wordGroupSets = {
    beginner: [
      { pattern: ['cat', 'dog', 'fish', 'car'], odd: 3 },
      { pattern: ['red', 'blue', 'green', 'happy'], odd: 3 },
      { pattern: ['big', 'small', 'tall', 'apple'], odd: 3 },
      { pattern: ['bed', 'den', 'dip', 'lamp'], odd: 3 },
      { pattern: ['nod', 'pod', 'pup', 'cup'], odd: 3 }
    ],
    easy: [
      { pattern: ['apple', 'banana', 'orange', 'chair'], odd: 3 },
      { pattern: ['run', 'jump', 'walk', 'table'], odd: 3 },
      { pattern: ['car', 'bus', 'train', 'flower'], odd: 3 },
      { pattern: ['bad', 'dad', 'dab', 'hat'], odd: 3 },
      { pattern: ['band', 'bend', 'pond', 'hand'], odd: 3 },
      { pattern: ['pump', 'dump', 'dump', 'lamp'], odd: 3 }
    ],
    moderate: [
      { pattern: ['cat', 'bat', 'hat', 'dog'], odd: 3 },
      { pattern: ['sun', 'fun', 'run', 'car'], odd: 3 },
      { pattern: ['ball', 'tall', 'call', 'fish'], odd: 3 },
      { pattern: ['bind', 'wind', 'mind', 'bake'], odd: 3 },
      { pattern: ['bud', 'dud', 'mud', 'pen'], odd: 3 },
      { pattern: ['blend', 'wend', 'bend', 'stand'], odd: 3 }
    ],
    hard: [
      { pattern: ['bad', 'dad', 'had', 'big'], odd: 3 },
      { pattern: ['look', 'book', 'took', 'tree'], odd: 3 },
      { pattern: ['night', 'light', 'right', 'happy'], odd: 3 },
      { pattern: ['bound', 'pound', 'wound', 'sound'], odd: 3 },
      { pattern: ['dumb', 'numb', 'bump', 'lump'], odd: 3 },
      { pattern: ['prompt', 'product', 'profound', 'purpose'], odd: 3 }
    ]
  }

  const generateRound = () => {
    if (!selectedLevel) return
    
    const groups = wordGroupSets[selectedLevel.id as keyof typeof wordGroupSets]
    const group = groups[Math.floor(Math.random() * groups.length)]
    const shuffledWords = [...group.pattern]
    
    let oddIndex = group.odd
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]]
      
      if (i === oddIndex) oddIndex = j
      else if (j === oddIndex) oddIndex = i
    }

    setGameState(prev => ({
      ...prev,
      words: shuffledWords,
      correctAnswer: oddIndex,
      selectedWord: null,
      feedback: '',
      startTime: Date.now()
    }))
  }

  const handleWordClick = (index: number) => {
    if (gameState.selectedWord !== null) return

    const isCorrect = index === gameState.correctAnswer
    const reactionTime = Date.now() - gameState.startTime
    
    let points = isCorrect ? 1 : 0
    if (selectedLevel && isCorrect && reactionTime < selectedLevel.timeLimit! * 1000) {
      points += 0.5
    } else if (selectedLevel && isCorrect && reactionTime < selectedLevel.timeLimit! * 2000) {
      points += 0.2
    }

    if (isCorrect) {
      playSuccessSound()
      const buttonElement = document.querySelector(`[data-word-index="${index}"]`) as HTMLElement
      if (buttonElement) {
        createParticles(buttonElement, '#10B981')
        createStickers(buttonElement, 'success')
      }
      
      // Level up sound for perfect rounds
      if (gameState.round > 0 && gameState.round % 3 === 0) {
        setTimeout(() => playLevelUpSound(), 500)
      }
    } else {
      playErrorSound()
      const buttonElement = document.querySelector(`[data-word-index="${index}"]`) as HTMLElement
      if (buttonElement) {
        createStickers(buttonElement, 'error')
      }
    }

    setGameState(prev => ({
      ...prev,
      selectedWord: index,
      score: prev.score + points,
      feedback: isCorrect 
        ? `🎉 Correct! +${points.toFixed(1)} points (${(reactionTime/1000).toFixed(1)}s)`
        : `😅 Try again! The odd one was "${gameState.words[gameState.correctAnswer]}"`
    }))

    if (!isCorrect) {
      setErrors(prev => ({ ...prev, [gameState.words.join(',')]: gameState.words[index] }))
    }

    setTimeout(async () => {
      if (!selectedLevel) return
      
      if (gameState.round >= selectedLevel.questionsCount) {
        // Call adaptive engine on game completion
        const accuracy = (gameState.score / selectedLevel.questionsCount) * 100
        const avgResponseTime = 2000 // Approximate based on timeout
        
        try {
          await onLevelEnd({
            gameName: "odd_one_out",
            accuracy,
            avgResponseTime,
            errors
          })
        } catch (err) {
          console.error("Failed to save adaptive data:", err)
        }
        
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 2000)
  }

  const resetGame = () => {
    setGameState({
      words: [],
      correctAnswer: -1,
      selectedWord: null,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      startTime: 0
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
    if (selectedLevel && gameState.words.length === 0) {
      generateRound()
    }
  }, [selectedLevel])

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
          <Eye className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Pattern Recognition Complete!</h2>
          <p className="text-gray-600 mb-6">Final Score: {gameState.score.toFixed(1)} points</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <button onClick={resetGame} className="btn btn-primary">
              Play Again
            </button>
            <button onClick={() => navigate('/games')} className="btn btn-default">
              Explore More Games
            </button>
            <button onClick={() => navigate('/profile')} className="btn btn-outline">
              View Profile
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
      <div className="max-w-3xl mx-auto">
        <AnimatedCard className="p-6 mb-6" delay={0.2}>
          <div className="flex justify-between items-center mb-4">
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              🔍 Odd One Out - {selectedLevel.name}
            </motion.h1>
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1 rounded-full"
                animate={{ scale: gameState.score > 0 ? [1, 1.1, 1] : 1 }}
              >
                <Target className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-bold text-blue-700">{gameState.score.toFixed(1)} pts</span>
              </motion.div>
              <div className="flex items-center bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-1 rounded-full">
                <Eye className="w-4 h-4 mr-2 text-purple-600" />
                <span className="font-bold text-purple-700">Round {gameState.round}/{selectedLevel.questionsCount}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <motion.p 
              className="text-lg font-semibold text-primary-600 mb-2"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🤔 Which word doesn't belong with the others?
            </motion.p>
            <p className="text-sm text-gray-600">
              💭 Look for patterns in sound, meaning, or appearance
            </p>
          </div>
        </AnimatedCard>

        <div className="card p-8">
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            {gameState.words.map((word, index) => {
              const isSelected = gameState.selectedWord === index
              const isCorrect = index === gameState.correctAnswer
              
              return (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InteractiveButton
                    onClick={() => handleWordClick(index)}
                    className={`aspect-square w-full text-2xl font-bold relative ${
                      isSelected 
                        ? isCorrect 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-700 shadow-lg' 
                          : 'bg-gradient-to-br from-red-100 to-red-200 border-red-500 text-red-700'
                        : 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-blue-100'
                    }`}
                    variant={isSelected ? (isCorrect ? 'success' : 'danger') : 'outline'}
                    disabled={gameState.selectedWord !== null}
                    particles={isCorrect && isSelected}
                  >
                    <div data-word-index={index} className="w-full h-full flex items-center justify-center">
                      <motion.span
                        className="text-2xl font-bold font-dyslexic"
                        animate={isSelected && isCorrect ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {word}
                      </motion.span>
                    </div>
                    
                    {isSelected && (
                      <motion.div 
                        className="absolute -top-2 -right-2"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.6 }}
                      >
                        {isCorrect ? (
                          <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                            ✓
                          </div>
                        ) : (
                          <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                            ✗
                          </div>
                        )}
                      </motion.div>
                    )}
                  </InteractiveButton>
                </motion.div>
              )
            })}
          </div>
          
          {gameState.feedback && (
            <motion.div 
              className={`mt-8 p-4 rounded-lg text-center font-semibold ${
                gameState.feedback.includes('Correct') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {gameState.feedback}
            </motion.div>
          )}
        </div>

        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-lg mb-3">💡 Tips:</h3>
          <ul className="text-gray-600 space-y-2">
            <li>• Look for words that rhyme or sound similar</li>
            <li>• Check if words belong to the same category</li>
            <li>• Notice visual patterns in spelling</li>
            <li>• Consider word length and structure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OddOneOutGame