import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Target, Clock, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'

interface GameState {
  targetWord: string
  scrambledLetters: string[]
  userWord: string[]
  score: number
  round: number
  timeLeft: number
  gameOver: boolean
  feedback: string
  isCorrect: boolean | null
}

const BuildWordGame: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    targetWord: '',
    scrambledLetters: [],
    userWord: [],
    score: 0,
    round: 1,
    timeLeft: 30,
    gameOver: false,
    feedback: '',
    isCorrect: null
  })
  const navigate = useNavigate()
  const gameConfig = gameConfigs['build-word']

  const mirrorLetterMap = {
    'B': 'D', 'b': 'd',
    'D': 'B', 'd': 'b',
    'P': 'Q', 'p': 'q',
    'Q': 'P', 'q': 'p',
    'M': 'W', 'm': 'w',
    'W': 'M', 'w': 'm',
    'N': 'U', 'n': 'u',
    'U': 'N', 'u': 'n'
  }

  const getLetterDisplayGroups = () => {
    const groups: Array<{ letters: string[], indices: number[] }> = []
    const usedIndices = new Set<number>()

    gameState.scrambledLetters.forEach((letter, index) => {
      if (usedIndices.has(index)) return

      const mirror = mirrorLetterMap[letter as keyof typeof mirrorLetterMap]
      const mirrorIndex = mirror 
        ? gameState.scrambledLetters.findIndex(
            (l, i) => !usedIndices.has(i) && l === mirror
          )
        : -1

      if (mirrorIndex !== -1 && mirrorIndex > index) {
        // Pair found
        groups.push({
          letters: [letter, mirror],
          indices: [index, mirrorIndex]
        })
        usedIndices.add(index)
        usedIndices.add(mirrorIndex)
      } else {
        // Single letter
        groups.push({
          letters: [letter],
          indices: [index]
        })
        usedIndices.add(index)
      }
    })

    return groups
  }

  const wordSets = {
    beginner: ['CAT', 'DOG', 'SUN', 'CAR', 'BED', 'DUG', 'PAN', 'WET'],
    easy: ['BALL', 'TREE', 'HOUSE', 'WATER', 'HAPPY', 'BLEND', 'POUND', 'WONDER', 'BUND', 'DUMB'],
    moderate: ['FRIEND', 'SCHOOL', 'GARDEN', 'WINDOW', 'BRIDGE', 'FLOWER', 'UPEND', 'MUDDY', 'BUNDLE', 'WONDER'],
    hard: ['ELEPHANT', 'COMPUTER', 'BEAUTIFUL', 'TELEPHONE', 'WONDERFUL', 'DANGEROUS', 'PROFOUND', 'DATABASE', 'PYRAMID', 'BOUNDARY']
  }

  const scrambleWord = (word: string): string[] => {
    const letters = word.split('')
    const extraLetters = ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'N']
    const numExtra = Math.min(2, Math.floor(word.length / 3))
    
    for (let i = 0; i < numExtra; i++) {
      const randomLetter = extraLetters[Math.floor(Math.random() * extraLetters.length)]
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter)
      }
    }
    
    // Add 30% chance to include a mirror letter as a distractor
    if (Math.random() < 0.3) {
      const mirrorEligible = letters.filter(l => mirrorLetterMap[l as keyof typeof mirrorLetterMap])
      if (mirrorEligible.length > 0) {
        const letterToMirror = mirrorEligible[Math.floor(Math.random() * mirrorEligible.length)]
        const mirroredLetter = mirrorLetterMap[letterToMirror as keyof typeof mirrorLetterMap]
        letters.push(mirroredLetter)
      }
    }
    
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    
    return letters
  }

  const generateRound = () => {
    if (!selectedLevel) return
    
    const words = wordSets[selectedLevel.id as keyof typeof wordSets]
    const word = words[Math.floor(Math.random() * words.length)]
    const scrambled = scrambleWord(word)
    
    setGameState(prev => ({
      ...prev,
      targetWord: word,
      scrambledLetters: scrambled,
      userWord: [],
      timeLeft: selectedLevel.timeLimit || 30,
      feedback: '',
      isCorrect: null
    }))
  }

  const addLetter = (letter: string, index: number) => {
    if (gameState.userWord.length >= gameState.targetWord.length) return
    
    const newUserWord = [...gameState.userWord, letter]
    const newScrambled = gameState.scrambledLetters.filter((_, i) => i !== index)
    
    setGameState(prev => ({
      ...prev,
      userWord: newUserWord,
      scrambledLetters: newScrambled
    }))
  }

  const removeLetter = (index: number) => {
    const letter = gameState.userWord[index]
    const newUserWord = gameState.userWord.filter((_, i) => i !== index)
    const newScrambled = [...gameState.scrambledLetters, letter]
    
    setGameState(prev => ({
      ...prev,
      userWord: newUserWord,
      scrambledLetters: newScrambled
    }))
  }

  const submitWord = () => {
    const userWordStr = gameState.userWord.join('')
    const isCorrect = userWordStr === gameState.targetWord
    const timeBonus = Math.max(0, gameState.timeLeft / 10)
    const points = isCorrect ? 1 + timeBonus : 0
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      feedback: isCorrect ? `Correct! +${points.toFixed(1)} points` : `Incorrect! The word was "${gameState.targetWord}"`,
      isCorrect
    }))

    setTimeout(() => {
      if (!selectedLevel) return
      
      if (gameState.round >= selectedLevel.questionsCount) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 2000)
  }

  const resetRound = () => {
    generateRound()
  }

  const resetGame = () => {
    setGameState({
      targetWord: '',
      scrambledLetters: [],
      userWord: [],
      score: 0,
      round: 1,
      timeLeft: 30,
      gameOver: false,
      feedback: '',
      isCorrect: null
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
    if (selectedLevel && !gameState.targetWord) {
      generateRound()
    }
  }, [selectedLevel])

  useEffect(() => {
    if (gameState.timeLeft > 0 && !gameState.gameOver && !gameState.feedback) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState.timeLeft === 0 && !gameState.feedback) {
      submitWord()
    }
  }, [gameState.timeLeft, gameState.gameOver, gameState.feedback])

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
          <h2 className="text-2xl font-bold mb-4">Word Building Complete!</h2>
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
    <div className="min-h-screen gradient-bg p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Build the Word - {selectedLevel.name}</h1>
            <div className="flex items-center justify-center sm:justify-end space-x-4">
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
            <p className="text-lg font-semibold text-primary-600">
              Build the word: {gameState.targetWord.length} letters
            </p>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Build Your Word:</h3>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap justify-center gap-2 mb-6 max-w-full">
              {Array.from({ length: gameState.targetWord.length }).map((_, index) => (
                <div
                  key={index}
                  className="w-[3rem] h-[3rem] sm:w-16 sm:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                >
                  {gameState.userWord[index] && (
                    <motion.button
                      onClick={() => removeLetter(index)}
                      className="w-full h-full bg-primary-500 text-white rounded-lg text-lg sm:text-xl font-bold hover:bg-primary-600 transition-colors"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {gameState.userWord[index]}
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Available Letters:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-center">
              {getLetterDisplayGroups().map((group, groupIndex) => (
                <div key={groupIndex} className="flex gap-1 items-center">
                  {group.letters.map((letter, letterIndex) => (
                    <motion.button
                      key={`${letter}-${group.indices[letterIndex]}`}
                      onClick={() => addLetter(letter, group.indices[letterIndex])}
                      className="w-[3rem] h-[3rem] sm:w-14 sm:h-14 bg-white border-2 border-gray-300 rounded-lg text-lg sm:text-xl font-bold hover:border-primary-400 hover:bg-primary-50 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!!gameState.feedback}
                    >
                      {letter}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
            <button
              onClick={submitWord}
              disabled={gameState.userWord.length !== gameState.targetWord.length || !!gameState.feedback}
              className="btn btn-primary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Word
            </button>
            
            <button
              onClick={resetRound}
              disabled={!!gameState.feedback}
              className="btn btn-outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>

          {gameState.feedback && (
            <motion.div 
              className={`mt-6 p-4 rounded-lg text-center font-semibold ${
                gameState.isCorrect 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {gameState.isCorrect ? (
                <CheckCircle className="w-6 h-6 inline mr-2" />
              ) : (
                <XCircle className="w-6 h-6 inline mr-2" />
              )}
              {gameState.feedback}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildWordGame