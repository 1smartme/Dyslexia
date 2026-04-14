import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Star, Trophy, Volume2, Lightbulb } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { DIFFICULTY_SETTINGS, getGameContent, pickConfusingWord, type GameContentItem } from '../../data/difficultySystem'

interface GameState {
  images: { name: string; emoji: string; id: number }[]
  selectedItems: number[]
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHints: boolean
  level: number
  soundMode: boolean
  targetWord: string
  targetId: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const SpeedWordsLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    images: [],
    selectedItems: [],
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHints: false,
    level: 1,
    soundMode: false,
    targetWord: '',
    targetId: -1,
    difficulty: 'easy'
  })
  const [, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const difficultyConfig = {
    easy: { rounds: DIFFICULTY_SETTINGS.easy.rounds, multiplier: DIFFICULTY_SETTINGS.easy.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.easy.hintsEnabled, maxLevel: 2 },
    medium: { rounds: DIFFICULTY_SETTINGS.medium.rounds, multiplier: DIFFICULTY_SETTINGS.medium.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.medium.hintsEnabled, maxLevel: 3 },
    hard: { rounds: DIFFICULTY_SETTINGS.hard.rounds, multiplier: DIFFICULTY_SETTINGS.hard.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.hard.hintsEnabled, maxLevel: 4 }
  } as const
  const maxRounds = difficultyConfig[gameState.difficulty].rounds

  const generateRound = (soundMode = gameState.soundMode) => {
    if (!user) return
    
    const difficulty = getAdaptiveDifficulty(user.email, 'wordRecognition')
    const maxLevel = difficultyConfig[gameState.difficulty].maxLevel
    const level = Math.min(maxLevel, Math.max(1, difficulty.level))
    const gridSize = Math.max(3, Math.min(9, 3 + level))
    const difficultyWords = getGameContent(gameState.difficulty)
    const pool = [...difficultyWords]
    if (gameState.difficulty === 'hard') {
      const confusing: GameContentItem[] = []
      for (const item of difficultyWords) {
        const w = pickConfusingWord(item.word)
        if (w == null) continue
        confusing.push({ word: w, image: '❓' })
        if (confusing.length >= 2) break
      }
      pool.push(...confusing)
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const roundImages = shuffled.slice(0, gridSize).map((item, index) => ({
      ...item,
      name: item.word,
      emoji: item.image,
      id: index
    }))

    let targetWord = ''
    let targetId = -1

    if (soundMode && roundImages.length > 0) {
      const targetItem = roundImages[Math.floor(Math.random() * roundImages.length)]
      targetWord = targetItem.name
      targetId = targetItem.id
    }

    setGameState(prev => ({
      ...prev,
      images: roundImages,
      selectedItems: [],
      feedback: '',
      showHints: false,
      level,
      soundMode,
      targetWord,
      targetId
    }))

    if (soundMode) {
      speakText('Listen carefully and tap the picture you hear.')
      setTimeout(() => speakText(targetWord), 700)
    } else {
      speakText('Name each picture as fast as you can!')
    }
  }

  const handleItemClick = (id: number) => {
    if (gameState.selectedItems.includes(id)) return

    const item = gameState.images.find(img => img.id === id)
    const newSelected = [...gameState.selectedItems, id]
    let accuracy = 1
    let scoreDelta = difficultyConfig[gameState.difficulty].multiplier

    if (gameState.soundMode) {
      const isCorrect = id === gameState.targetId
      accuracy = isCorrect ? 1 : 0
      scoreDelta = isCorrect ? difficultyConfig[gameState.difficulty].multiplier : 0

      if (user) {
        updateGameProgress(user.email, 'wordRecognition', {
          accuracy,
          reactionTime: 1000,
          difficulty: gameState.level,
          timestamp: Date.now()
        })
      }

      setGameState(prev => ({
        ...prev,
        selectedItems: newSelected,
        score: prev.score + scoreDelta,
        feedback: isCorrect
          ? getEncouragingMessage(1, true)
          : 'That is the mirror or wrong picture. Try again!'
      }))

      if (isCorrect) {
        setTimeout(() => nextRound(), 1500)
      }

      if (item) {
        speakText(isCorrect ? `Correct! This is ${item.name}` : `No, this is not ${gameState.targetWord}`)
      }
      return
    }

    if (user && item) {
      updateGameProgress(user.email, 'wordRecognition', {
        accuracy: 1,
        reactionTime: 1000,
        difficulty: gameState.level,
        timestamp: Date.now()
      })
    }

    setGameState(prev => ({
      ...prev,
      selectedItems: newSelected,
      score: prev.score + 1
    }))

    if (item) {
      speakText(item.name)
    }

    if (newSelected.length === gameState.images.length) {
      setGameState(prev => ({ ...prev, feedback: getEncouragingMessage(1, true) }))
      setTimeout(() => nextRound(), 2000)
    }
  }

  const showHints = () => {
    if (!difficultyConfig[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    if (gameState.soundMode) {
      speakText(`Listen again: ${gameState.targetWord}`)
      return
    }

    setGameState(prev => ({ ...prev, showHints: true }))
    gameState.images.forEach((item, index) => {
      setTimeout(() => speakText(item.name), index * 1000)
    })
  }

  const nextRound = () => {
    if (gameState.round >= maxRounds) {
      setGameState(prev => ({ ...prev, gameOver: true }))
    } else {
      setGameState(prev => ({ ...prev, round: prev.round + 1 }))
      generateRound(gameState.soundMode)
    }
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      images: [],
      selectedItems: [],
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHints: false,
      level: 1,
      targetWord: '',
      targetId: -1,
      difficulty: 'easy'
    }))
    setScoreSaved(false)
    setHasStarted(false)
  }

  useEffect(() => {
    if (!user || !hasStarted) return
    generateRound(gameState.soundMode)
  }, [user, gameState.soundMode, hasStarted])

  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      selectedItems: [],
      difficulty: selectedDifficulty
    }))
    setScoreSaved(false)
    setHasStarted(true)
    window.setTimeout(() => generateRound(gameState.soundMode), 0)
  }

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'speed_words',
          difficulty: gameState.level.toString(),
          accuracy: Math.min(1, gameState.score / maxRounds),
          avgResponseTime: 0,
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save speed words score:', error)
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.level])

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Speed Learning Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Score: {gameState.score} • Level: {gameState.level}</p>
          <button onClick={resetGame} className="btn btn-primary w-full">Continue Learning</button>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
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
            <h1 className="text-2xl font-bold">Speed Words Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score} pts</span>
              </div>
              <button
                onClick={() => generateRound(!gameState.soundMode)}
                className={`btn btn-sm ${gameState.soundMode ? 'btn-secondary' : 'btn-outline'}`}
              >
                {gameState.soundMode ? 'Visual Mode' : 'Sound Recognition'}
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">Round {gameState.round} of {maxRounds}</p>
            <p className="text-lg font-semibold text-primary-600">
              {gameState.soundMode
                ? 'Listen and tap the picture you hear.'
                : 'Click each picture and say its name!'}
            </p>
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
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-2">
              <button onClick={showHints} className="btn btn-outline btn-sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                {gameState.soundMode ? 'Repeat Sound' : 'Hear All Names'}
              </button>
              {gameState.soundMode && (
                <button onClick={() => speakText(gameState.targetWord)} className="btn btn-primary btn-sm">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Repeat Word
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-3 gap-6">
            {gameState.images.map((item) => {
              const isSelected = gameState.selectedItems.includes(item.id)
              const isWrongSelection = isSelected && gameState.soundMode && item.id !== gameState.targetId
              const selectionOrder = gameState.selectedItems.indexOf(item.id) + 1
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`aspect-square rounded-xl border-2 transition-all relative flex flex-col items-center justify-center p-4 ${
                    isWrongSelection
                      ? 'bg-red-100 border-red-500 cursor-default'
                      : isSelected
                        ? 'bg-green-100 border-green-500 cursor-default'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                  whileHover={!isSelected ? { scale: 1.05 } : {}}
                  disabled={isSelected}
                >
                  <div className="text-6xl mb-2">{item.emoji}</div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    {gameState.soundMode ? 'Sound choice' : item.name}
                  </div>
                  
                  {isSelected && (
                    <motion.div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {selectionOrder}
                    </motion.div>
                  )}
                  
                  {gameState.showHints && !isSelected && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); speakText(item.name) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          speakText(item.name)
                        }
                      }}
                      className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
          
          {gameState.feedback && (
            <motion.div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-center font-semibold">
              {gameState.feedback}
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="w-96 flex-shrink-0">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="speed-words"
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

export default SpeedWordsLearning