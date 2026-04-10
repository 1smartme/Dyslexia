import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Star, Trophy, Lightbulb, Volume2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { DIFFICULTY_SETTINGS } from '../../data/difficultySystem'

interface GameState {
  letters: string[]
  targetLetter: string
  selectedIndices: number[]
  correctIndices: number[]
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHint: boolean
  level: number
  difficulty: 'easy' | 'medium' | 'hard'
}

const LetterMirrorLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    letters: [],
    targetLetter: '',
    selectedIndices: [],
    correctIndices: [],
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHint: false,
    level: 1,
    difficulty: 'easy'
  })
  const [caseMode, setCaseMode] = useState<'upper' | 'lower' | null>(null)
  const [, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const startGame = (mode: 'upper' | 'lower') => {
    setCaseMode(mode)
    setGameState({
      letters: [],
      targetLetter: '',
      selectedIndices: [],
      correctIndices: [],
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHint: false,
      level: 1,
      difficulty: 'easy'
    })
    setScoreSaved(false)
    setHasStarted(false)
  }

  const mirrorMap: Record<string, string> = {
    // 🔵 UPPERCASE LETTERS
    A: 'A', B: 'ᗺ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'ꟻ', G: '⅁', H: 'H', I: 'I',
    J: '⅃', K: 'ꓘ', L: '⅂', M: 'M', N: 'И', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'Я',
    S: 'Ƨ', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z',

    // 🟢 LOWERCASE LETTERS
    a: 'ɒ', b: 'd', c: 'ɔ', d: 'b', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'i',
    j: 'ɾ', k: 'ʞ', l: 'ן', m: 'ɯ', n: 'u', o: 'o', p: 'q', q: 'p', r: 'ɹ',
    s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z'
  }

  const difficultyConfig = {
    easy: { rounds: DIFFICULTY_SETTINGS.easy.rounds, multiplier: DIFFICULTY_SETTINGS.easy.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.easy.hintsEnabled, maxLevel: 2 },
    medium: { rounds: DIFFICULTY_SETTINGS.medium.rounds, multiplier: DIFFICULTY_SETTINGS.medium.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.medium.hintsEnabled, maxLevel: 3 },
    hard: { rounds: DIFFICULTY_SETTINGS.hard.rounds, multiplier: DIFFICULTY_SETTINGS.hard.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.hard.hintsEnabled, maxLevel: 4 }
  } as const
  const maxRounds = difficultyConfig[gameState.difficulty].rounds

  const generateRound = (mode: 'upper' | 'lower' | null = caseMode) => {
    if (!user || !mode) return

    const mirrorLetters = Object.keys(mirrorMap).filter(letter =>
      mode === 'upper' ? /^[A-Z]$/.test(letter) : /^[a-z]$/.test(letter)
    )

    const difficulty = getAdaptiveDifficulty(user.email, 'letterSequencing')
    const target = mirrorLetters[Math.floor(Math.random() * mirrorLetters.length)]
    const targetMirror = mirrorMap[target]
    const level = Math.min(difficultyConfig[gameState.difficulty].maxLevel, Math.max(1, difficulty.level))
    const gridSize = Math.min(8 + level * 2, 16)
    const letters: string[] = []
    
    const targetCount = Math.max(2, Math.min(4, level))
    const otherLetters = mirrorLetters.filter(l => l !== target)
    
    for (let i = 0; i < gridSize; i++) {
      if (i < targetCount) {
        letters.push(target)
      } else {
        if (targetMirror && Math.random() < 0.2) {
          letters.push(targetMirror)
        } else {
          const other = otherLetters[Math.floor(Math.random() * otherLetters.length)]
          const displayLetter = Math.random() < 0.5 ? other : mirrorMap[other] || other
          letters.push(displayLetter)
        }
      }
    }
    
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }

    const correctIndices = letters
      .map((letter, index) => letter === target ? index : -1)
      .filter(index => index !== -1)

    setGameState(prev => ({
      ...prev,
      letters,
      targetLetter: target,
      correctIndices,
      selectedIndices: [],
      feedback: '',
      showHint: false,
      level
    }))
    
    speakText(`Find all the ${target} letters`)
  }

  const handleLetterClick = (index: number) => {
    if (gameState.selectedIndices.includes(index)) return

    const newSelected = [...gameState.selectedIndices, index]
    const isCorrect = gameState.correctIndices.includes(index)
    const accuracy = isCorrect ? 1 : 0
    
    if (user) {
      updateGameProgress(user.email, 'letterSequencing', {
        accuracy,
        reactionTime: 1000,
        difficulty: gameState.level,
        timestamp: Date.now()
      })
    }

    setGameState(prev => ({
      ...prev,
      selectedIndices: newSelected,
      score: prev.score + (isCorrect ? difficultyConfig[gameState.difficulty].multiplier : 0),
      feedback: getEncouragingMessage(accuracy, true)
    }))

    const allCorrectSelected = gameState.correctIndices.every(i => 
      newSelected.includes(i) || gameState.selectedIndices.includes(i)
    )
    
    if (allCorrectSelected) {
      setTimeout(() => nextRound(), 1500)
    }
  }

  const showHint = () => {
    if (!difficultyConfig[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    setGameState(prev => ({ ...prev, showHint: true }))
    speakText(`Look for the letter ${gameState.targetLetter}. Mirror shapes are distractors. It appears ${gameState.correctIndices.length} times.`)
  }

  const nextRound = () => {
    if (gameState.round >= maxRounds) {
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
      gameOver: false,
      feedback: '',
      showHint: false,
      level: 1,
      difficulty: 'easy'
    })
    setScoreSaved(false)
    setHasStarted(false)
  }

  useEffect(() => {
    if (!hasStarted) return
    generateRound(caseMode)
  }, [user, caseMode, hasStarted])

  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      selectedIndices: [],
      difficulty: selectedDifficulty
    }))
    setScoreSaved(false)
    setHasStarted(true)
    window.setTimeout(() => generateRound(caseMode), 0)
  }

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'letter_mirror',
          difficulty: gameState.level.toString(),
          accuracy: Math.min(1, gameState.score / Math.max(1, gameState.correctIndices.length * gameState.round)),
          avgResponseTime: 0,
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save letter mirror score:', error)
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.level, gameState.correctIndices.length, gameState.round])

  if (!caseMode) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold mb-4">Choose Letter Case Mode</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Select uppercase or lowercase letters before starting the mirror game.</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => startGame('upper')} className="btn btn-primary py-4 text-xl">
              Uppercase Letters
            </button>
            <button onClick={() => startGame('lower')} className="btn btn-secondary py-4 text-xl">
              Lowercase Letters
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Eye className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Eye className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Visual Learning Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Score: {gameState.score} • Level: {gameState.level}</p>
          <button onClick={resetGame} className="btn btn-primary w-full">Continue Learning</button>
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
            <h1 className="text-2xl font-bold">Letter Mirror Learning</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold">{gameState.score} pts</span>
              </div>
              <button onClick={() => setCaseMode(null)} className="btn btn-outline btn-sm">
                Change Case
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">Round {gameState.round} of {maxRounds}</p>
            <p className="text-lg font-semibold text-primary-600">
              Find all "{gameState.targetLetter}" letters. Mirror shapes are distractors.
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
          </div>
        </div>

        <div className="card p-6 mb-6 text-center">
          <p className="text-lg mb-2">Target Letter:</p>
          <div className="text-6xl font-bold text-primary-600 bg-primary-50 rounded-lg p-4 inline-block mb-4">
            {gameState.targetLetter}
          </div>
          <div className="flex justify-center space-x-4">
            <button onClick={() => speakText(gameState.targetLetter)} className="btn btn-outline btn-sm">
              <Volume2 className="w-4 h-4 mr-2" />
              Hear Letter
            </button>
            <button onClick={showHint} className="btn btn-ghost btn-sm">
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {gameState.letters.map((letter, index) => {
              const isSelected = gameState.selectedIndices.includes(index)
              const isCorrect = gameState.correctIndices.includes(index)
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleLetterClick(index)}
                  className={`aspect-square text-3xl font-bold rounded-lg border-2 transition-all ${
                    isSelected 
                      ? isCorrect 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  disabled={isSelected}
                >
                  {letter}
                </motion.button>
              )
            })}
          </div>
          
          {gameState.showHint && (
            <motion.div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-center">
              💡 Look carefully! The letter "{gameState.targetLetter}" appears {gameState.correctIndices.length} times.
            </motion.div>
          )}
          
          {gameState.feedback && (
            <motion.div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold">
              {gameState.feedback}
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="w-96 flex-shrink-0">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="letter-mirror"
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

export default LetterMirrorLearning