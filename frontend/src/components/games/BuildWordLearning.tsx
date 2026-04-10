import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Puzzle, Star, Trophy, Lightbulb, Volume2, RotateCcw, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { playSuccessSound, playErrorSound } from '../../lib/gameEffects'
import { DIFFICULTY_SETTINGS, getGameContent } from '../../data/difficultySystem'
import { CameraTracker } from '../tracking/CameraTracker'

interface GameState {
  targetWord: string
  scrambledLetters: string[]
  userWord: string[]
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHint: boolean
  level: number
  timeLeft: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const BuildWordLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    targetWord: '',
    scrambledLetters: [],
    userWord: [],
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHint: false,
    level: 1,
    timeLeft: 15,
    difficulty: 'easy'
  })
  const [savingScore, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const wordsByLevel = {
    1: getGameContent('easy').map(item => item.word.toUpperCase()),
    2: getGameContent('medium').map(item => item.word.toUpperCase()),
    3: getGameContent('hard').map(item => item.word.toUpperCase()),
    4: getGameContent('hard').map(item => item.word.toUpperCase())
  }

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
        groups.push({
          letters: [letter, mirror],
          indices: [index, mirrorIndex]
        })
        usedIndices.add(index)
        usedIndices.add(mirrorIndex)
      } else {
        groups.push({
          letters: [letter],
          indices: [index]
        })
        usedIndices.add(index)
      }
    })

    return groups
  }

  const difficultyConfig = {
    easy: { rounds: DIFFICULTY_SETTINGS.easy.rounds, time: DIFFICULTY_SETTINGS.easy.time, multiplier: DIFFICULTY_SETTINGS.easy.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.easy.hintsEnabled, maxLevel: 2 },
    medium: { rounds: DIFFICULTY_SETTINGS.medium.rounds, time: DIFFICULTY_SETTINGS.medium.time, multiplier: DIFFICULTY_SETTINGS.medium.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.medium.hintsEnabled, maxLevel: 3 },
    hard: { rounds: DIFFICULTY_SETTINGS.hard.rounds, time: DIFFICULTY_SETTINGS.hard.time, multiplier: DIFFICULTY_SETTINGS.hard.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.hard.hintsEnabled, maxLevel: 4 }
  } as const

  const maxRounds = difficultyConfig[gameState.difficulty].rounds

  const generateRound = (selectedDifficulty = gameState.difficulty) => {
    if (!user) return
    
    const difficulty = getAdaptiveDifficulty(user.email, 'letterSequencing')
    const maxLevel = difficultyConfig[gameState.difficulty].maxLevel
    const level = Math.min(maxLevel, Math.max(1, difficulty.level))
    const levelWords = wordsByLevel[level as keyof typeof wordsByLevel]
    const word = levelWords[Math.floor(Math.random() * levelWords.length)]
    
    const letters = word.split('')
    const scrambled = [...letters]
    
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]]
    }
    
    setGameState(prev => ({
      ...prev,
      targetWord: word,
      scrambledLetters: scrambled,
      userWord: [],
      feedback: '',
      showHint: false,
      level,
      timeLeft: difficultyConfig[selectedDifficulty].time
    }))
    
    speakText(`Build the word: ${word.toLowerCase()}`)
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
    
    speakText(letter)
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
    const accuracy = isCorrect ? 1 : 0
    
    if (user) {
      updateGameProgress(user.email, 'letterSequencing', {
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
      speakText('Excellent! You built the word correctly!')
    } else {
      playErrorSound()
      speakText(`Not quite. The correct word is ${gameState.targetWord.toLowerCase()}`)
    }

    setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 2500)
  }

  const showHint = () => {
    if (!difficultyConfig[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    setGameState(prev => ({ ...prev, showHint: true }))
    speakText(`The word is ${gameState.targetWord.toLowerCase()}. Listen to each letter:`)
    
    gameState.targetWord.split('').forEach((letter, index) => {
      setTimeout(() => speakText(letter), (index + 1) * 800)
    })
  }

  const resetGame = () => {
    setGameState({
      targetWord: '',
      scrambledLetters: [],
      userWord: [],
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHint: false,
      level: 1,
      timeLeft: 15,
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
    if (gameState.gameOver || !!gameState.feedback || gameState.timeLeft <= 0 || !gameState.targetWord) return
    const timer = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [gameState.gameOver, gameState.feedback, gameState.timeLeft, gameState.targetWord])

  useEffect(() => {
    if (gameState.gameOver || !!gameState.feedback || gameState.timeLeft > 0 || gameState.userWord.length === 0) return
    playErrorSound()
    setGameState(prev => ({ ...prev, feedback: "⏰ Time's up! Let's try another word." }))
    const timeout = window.setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound()
      }
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [gameState.timeLeft, gameState.feedback, gameState.gameOver, gameState.round, gameState.userWord.length])

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'build_word',
          difficulty: gameState.level.toString(),
          accuracy: Math.min(1, gameState.score / maxRounds),
          avgResponseTime: 0,
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save build word score:', error)
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
          <Puzzle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Word Building Complete!</h2>
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
          <Puzzle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
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
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:flex-1 max-w-4xl mx-auto xl:mx-0">
          <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Build Word Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-purple-500" />
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
            <p className="text-lg font-semibold text-primary-600">
              Build: {gameState.targetWord.toLowerCase()}
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <button onClick={() => speakText(gameState.targetWord.toLowerCase())} className="btn btn-outline btn-sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Hear Word
              </button>
              <button onClick={showHint} className="btn btn-ghost btn-sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                Spell Help
              </button>
            </div>
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

          <div className="card p-6 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Word:</h3>
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: gameState.targetWord.length }).map((_, index) => (
                <div key={index} className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  {gameState.userWord[index] && (
                    <motion.button
                      onClick={() => removeLetter(index)}
                      className="w-full h-full bg-primary-500 text-white rounded-lg text-xl font-bold hover:bg-primary-600"
                      whileHover={{ scale: 1.05 }}
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
            <div className="flex flex-wrap justify-center gap-3">
              {getLetterDisplayGroups().map((group, groupIndex) => (
                <div key={groupIndex} className="flex gap-1 items-center">
                  {group.letters.map((letter, letterIndex) => (
                    <motion.button
                      key={`${letter}-${group.indices[letterIndex]}`}
                      onClick={() => addLetter(letter, group.indices[letterIndex])}
                      className="w-14 h-14 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-xl font-bold text-gray-900 dark:text-white hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all"
                      whileHover={{ scale: 1.05 }}
                      disabled={!!gameState.feedback}
                    >
                      {letter}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={submitWord}
              disabled={gameState.userWord.length !== gameState.targetWord.length || !!gameState.feedback}
              className="btn btn-primary"
            >
              Check Word
            </button>
            
            <button onClick={() => generateRound()} disabled={!!gameState.feedback} className="btn btn-outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>

          {gameState.showHint && (
            <motion.div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center">
              💡 Listen to each letter sound and put them in order to make the word.
            </motion.div>
          )}

          {gameState.feedback && (
            <motion.div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold">
              {gameState.feedback}
            </motion.div>
          )}
          </div>
        </div>
        <div className="w-full xl:w-96 xl:flex-shrink-0 mx-auto xl:mx-0">
          <CameraTracker
            userId={String(user?.id || user?.email || 'guest')}
            gameScore={gameState.score}
            gameName="build-word"
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

export default BuildWordLearning