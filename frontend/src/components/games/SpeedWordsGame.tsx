import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'
import { saveGameScore } from '../../services/gamesService'
import { useAuth } from '../../contexts/AuthContext'

interface GameState {
  images: { name: string; emoji: string; id: number }[]
  selectedItems: number[]
  score: number
  round: number
  startTime: number
  gameOver: boolean
  roundStartTime: number
}

const SpeedWordsGame: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    images: [],
    selectedItems: [],
    score: 0,
    round: 1,
    startTime: 0,
    gameOver: false,
    roundStartTime: 0
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const gameConfig = gameConfigs['speed-words-learning']

  const imageItemSets = {
    beginner: [
      { name: 'cat', emoji: '🐱' },
      { name: 'dog', emoji: '🐶' },
      { name: 'sun', emoji: '☀️' },
      { name: 'car', emoji: '🚗' },
      { name: 'bed', emoji: '🛏️' },
      { name: 'pan', emoji: '🍳' }
    ],
    easy: [
      { name: 'house', emoji: '🏠' },
      { name: 'tree', emoji: '🌳' },
      { name: 'ball', emoji: '⚽' },
      { name: 'fish', emoji: '🐟' },
      { name: 'bird', emoji: '🐦' },
      { name: 'star', emoji: '⭐' },
      { name: 'band', emoji: '🎸' },
      { name: 'pond', emoji: '🦆' }
    ],
    moderate: [
      { name: 'flower', emoji: '🌸' },
      { name: 'butterfly', emoji: '🦋' },
      { name: 'rainbow', emoji: '🌈' },
      { name: 'mountain', emoji: '⛰️' },
      { name: 'ocean', emoji: '🌊' },
      { name: 'airplane', emoji: '✈️' },
      { name: 'bicycle', emoji: '🚲' },
      { name: 'umbrella', emoji: '☂️' },
      { name: 'bundle', emoji: '📦' },
      { name: 'pendant', emoji: '💎' }
    ],
    hard: [
      { name: 'telescope', emoji: '🔭' },
      { name: 'microscope', emoji: '🔬' },
      { name: 'calculator', emoji: '🧮' },
      { name: 'thermometer', emoji: '🌡️' },
      { name: 'stethoscope', emoji: '🩺' },
      { name: 'helicopter', emoji: '🚁' },
      { name: 'submarine', emoji: '🚤' },
      { name: 'parachute', emoji: '🪂' },
      { name: 'compass', emoji: '🧭' },
      { name: 'binoculars', emoji: '🔍' },
      { name: 'profound', emoji: '🧠' },
      { name: 'boundary', emoji: '🚧' }
    ]
  }

  const generateRound = () => {
    if (!selectedLevel) return
    
    const items = imageItemSets[selectedLevel.id as keyof typeof imageItemSets]
    const gridSize = Math.min(4 + Math.floor(gameState.round / 2), items.length)
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    const roundImages = shuffled.slice(0, gridSize).map((item, index) => ({
      ...item,
      id: index
    }))

    setGameState(prev => ({
      ...prev,
      images: roundImages,
      selectedItems: [],
      roundStartTime: Date.now()
    }))
  }

  const handleItemClick = (id: number) => {
    if (gameState.selectedItems.includes(id)) return

    const newSelected = [...gameState.selectedItems, id]
    const reactionTime = Date.now() - gameState.roundStartTime
    
    let points = 1
    if (selectedLevel) {
      const timeLimit = selectedLevel.timeLimit || 5
      if (reactionTime < timeLimit * 200) points += 0.5
      else if (reactionTime < timeLimit * 400) points += 0.2
    }

    setGameState(prev => ({
      ...prev,
      selectedItems: newSelected,
      score: prev.score + points
    }))

    if (newSelected.length === gameState.images.length) {
      setTimeout(() => nextRound(), 1000)
    }
  }

  const nextRound = async () => {
    if (!selectedLevel) return
    
    if (gameState.round >= selectedLevel.questionsCount) {
      // Save score to backend
      const totalTime = Date.now() - gameState.startTime
      const accuracy = 100 // Speed game assumes all correct
      const avgResponseTime = totalTime / selectedLevel.questionsCount
      
      if (user?.id) {
        try {
          await saveGameScore({
            userId: String(user.id),
            gameName: 'speed_words',
            difficulty: String(selectedLevel.difficulty),
            accuracy: accuracy / 100,
            avgResponseTime,
            errors: {}
          })
        } catch (err) {
          console.error("Failed to save score:", err)
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
      images: [],
      selectedItems: [],
      score: 0,
      round: 1,
      startTime: Date.now(),
      gameOver: false,
      roundStartTime: 0
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
      startTime: Date.now()
    }))
    generateRound()
  }

  useEffect(() => {
    if (selectedLevel && gameState.images.length === 0) {
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
    const totalTime = ((Date.now() - gameState.startTime) / 1000).toFixed(1)
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div 
          className="card p-8 text-center max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Speed Challenge Complete!</h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">Final Score: {gameState.score.toFixed(1)} points</p>
            <p className="text-gray-600">Total Time: {totalTime}s</p>
            <p className="text-gray-600">Average per Round: {(parseFloat(totalTime) / selectedLevel.questionsCount).toFixed(1)}s</p>
          </div>
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
    <div className="min-h-screen gradient-bg p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Speed Words - {selectedLevel.name}</h1>
            <div className="flex items-center justify-center sm:justify-end space-x-4">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score.toFixed(1)} pts</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Round {gameState.round}/{selectedLevel.questionsCount}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-primary-600">
              Click each picture as fast as you can!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Faster clicks earn bonus points
            </p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {gameState.selectedItems.length}/{gameState.images.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameState.selectedItems.length / gameState.images.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {gameState.images.map((item) => {
              const isSelected = gameState.selectedItems.includes(item.id)
              const selectionOrder = gameState.selectedItems.indexOf(item.id) + 1
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    aspect-square rounded-xl border-2 transition-all duration-200 relative
                    flex flex-col items-center justify-center p-3 sm:p-4
                    ${isSelected 
                      ? 'bg-green-100 border-green-500 cursor-default' 
                      : 'bg-white border-gray-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
                    }
                  `}
                  whileHover={!isSelected ? { scale: 1.05 } : {}}
                  whileTap={!isSelected ? { scale: 0.95 } : {}}
                  disabled={isSelected}
                >
                  <div className="text-4xl sm:text-6xl mb-2">{item.emoji}</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-700 font-dyslexic text-center break-words">{item.name}</div>
                  
                  {isSelected && (
                    <motion.div 
                      className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {selectionOrder}
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
          
          {gameState.selectedItems.length === gameState.images.length && (
            <motion.div 
              className="mt-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🎉 Round Complete! Moving to next round...
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpeedWordsGame