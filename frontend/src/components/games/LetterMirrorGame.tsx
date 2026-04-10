import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import { saveGameScore } from '../../services/gamesService'
import { useAuth } from '../../contexts/AuthContext'

interface GameState {
  letters: string[]
  targetLetter: string
  selectedIndices: number[]
  correctIndices: number[]
  score: number
  round: number
  timeLeft: number
  gameOver: boolean
  feedback: string
}

const LetterMirrorGame: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    letters: [],
    targetLetter: '',
    selectedIndices: [],
    correctIndices: [],
    score: 0,
    round: 1,
    timeLeft: 15,
    gameOver: false,
    feedback: ''
  })
  const [errors, setErrors] = useState<Record<string, any>>({})
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const gameConfig = gameConfigs['letter-mirror']

  const mirrorLetterSets = {
    beginner: ['b', 'd', 'p', 'q'],
    easy: ['b', 'd', 'p', 'q', 'n', 'u'],
    moderate: ['b', 'd', 'p', 'q', 'n', 'u', 'm', 'w', 'f', 't']
  }

  const generateRound = () => {
    if (!selectedLevel) return
    
    const letters = mirrorLetterSets[selectedLevel.id as keyof typeof mirrorLetterSets]
    const target = letters[Math.floor(Math.random() * letters.length)]
    const gridSize = Math.min(8 + gameState.round, 16)
    const gameLetters = []
    const correctIndices = []
    
    const targetCount = Math.floor(Math.random() * 3) + 2
    
    for (let i = 0; i < gridSize; i++) {
      if (i < targetCount) {
        gameLetters.push(target)
        correctIndices.push(i)
      } else {
        const otherLetters = letters.filter(l => l !== target)
        gameLetters.push(otherLetters[Math.floor(Math.random() * otherLetters.length)])
      }
    }
    
    for (let i = gameLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gameLetters[i], gameLetters[j]] = [gameLetters[j], gameLetters[i]]
      
      if (correctIndices.includes(i)) {
        correctIndices[correctIndices.indexOf(i)] = j
      }
      if (correctIndices.includes(j)) {
        correctIndices[correctIndices.indexOf(j)] = i
      }
    }

    setGameState(prev => ({
      ...prev,
      letters: gameLetters,
      targetLetter: target,
      correctIndices,
      selectedIndices: [],
      timeLeft: selectedLevel.timeLimit || 8,
      feedback: ''
    }))
  }

  const handleLetterClick = (index: number) => {
    if (gameState.gameOver || gameState.selectedIndices.includes(index)) return

    const newSelected = [...gameState.selectedIndices, index]
    const isCorrect = gameState.correctIndices.includes(index)
    
    let scoreChange = 0
    if (isCorrect) {
      scoreChange = 1
    } else {
      scoreChange = -0.5
    }

    setGameState(prev => ({
      ...prev,
      selectedIndices: newSelected,
      score: Math.max(0, prev.score + scoreChange),
      feedback: isCorrect ? 'Correct!' : 'Wrong letter!'
    }))

    const allCorrectSelected = gameState.correctIndices.every(i => 
      newSelected.includes(i) || gameState.selectedIndices.includes(i)
    )
    
    if (allCorrectSelected) {
      setTimeout(() => nextRound(), 1000)
    }
  }

  const nextRound = async () => {
    if (!selectedLevel) return
    
    if (gameState.round >= selectedLevel.questionsCount) {
      // Save score to backend
      const accuracy = Math.max(0, (gameState.score / selectedLevel.questionsCount) * 100)
      const avgResponseTime = (selectedLevel.timeLimit || 8) * 1000
      
      if (user?.id) {
        setSaving(true)
        try {
          await saveGameScore({
            userId: user.id,
            gameName: 'letter_mirror',
            difficulty: selectedLevel.difficulty,
            accuracy: accuracy / 100,
            avgResponseTime,
            errors
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
  }

  const resetGame = () => {
    setGameState({
      letters: [],
      targetLetter: '',
      selectedIndices: [],
      correctIndices: [],
      score: 0,
      round: 1,
      timeLeft: 15,
      gameOver: false,
      feedback: ''
    })
    generateRound()
  }

  const handleBack = () => {
    navigate('/games')
  }

  const startGame = (level: GameLevel) => {
    setSelectedLevel(level)
    setGameState(prev => ({
      ...prev,
      timeLeft: level.timeLimit || 8
    }))
    generateRound()
  }

  useEffect(() => {
    if (selectedLevel && gameState.letters.length === 0) {
      generateRound()
    }
  }, [selectedLevel])

  useEffect(() => {
    if (gameState.timeLeft > 0 && !gameState.gameOver && selectedLevel) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState.timeLeft === 0) {
      nextRound()
    }
  }, [gameState.timeLeft, gameState.gameOver, selectedLevel])

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
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Game Complete!</h2>
          <p className="text-gray-600 mb-6">Final Score: {gameState.score.toFixed(1)} points</p>
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
      <div className="max-w-4xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Letter Mirror - {selectedLevel.name}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                <span className="font-semibold">{gameState.timeLeft}s</span>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score.toFixed(1)} pts</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">Round {gameState.round} of {selectedLevel.questionsCount}</p>
            <p className="text-xl font-bold text-primary-600">
              Click all "{gameState.targetLetter}" letters
            </p>
          </div>
        </div>

        <div className="card p-6 mb-6 text-center">
          <p className="text-lg mb-2">Target Letter:</p>
          <div className="text-6xl font-bold text-primary-600 bg-primary-50 rounded-lg p-4 inline-block">
            {gameState.targetLetter}
          </div>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {gameState.letters.map((letter, index) => {
              const isSelected = gameState.selectedIndices.includes(index)
              const isCorrect = gameState.correctIndices.includes(index)
              const isWrong = isSelected && !isCorrect
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleLetterClick(index)}
                  className={`
                    aspect-square text-3xl font-bold rounded-lg border-2 transition-all duration-200 relative
                    ${isSelected 
                      ? isCorrect 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-white border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSelected}
                >
                  {letter}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
          
          {gameState.feedback && (
            <motion.div 
              className={`mt-4 p-3 rounded-lg text-center font-semibold ${
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
      </div>
    </div>
  )
}

export default LetterMirrorGame