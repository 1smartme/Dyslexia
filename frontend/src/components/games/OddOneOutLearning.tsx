import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Trophy, Lightbulb, Volume2, RotateCcw, VolumeX, Target } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { updateGameProgress, getAdaptiveDifficulty, getEncouragingMessage, speakText } from '../../lib/learningProgress'
import { saveGameScore, getRecentScores } from '../../services/scoreService'
import { CameraTracker } from '../tracking/CameraTracker'
import { wordGroups } from '../../data/wordGroups'
import { DIFFICULTY_SETTINGS, getGameContent, pickConfusingWord } from '../../data/difficultySystem'

const translations = {
  en: {
    title: 'Odd One Out Learning',
    instruction: 'Which word doesn\'t belong?',
    readAll: 'Read All',
    hint: 'Hint',
    restart: 'Restart',
    patternTips: 'Pattern Tips',
    listenRhyming: 'Listen for rhyming sounds',
    groupCategories: 'Group by categories',
    lookShapes: 'Look at word shapes',
    compareLengths: 'Compare word lengths',
    yourScores: 'Your Recent Scores',
    noScores: 'No scores yet. Play some rounds to see your progress!',
    currentStreak: 'Current Streak',
    responseTime: 'Response Time',
    accuracy: 'Accuracy',
    complete: 'Pattern Learning Complete!',
    continue: 'Continue Learning'
  },
  es: {
    title: 'Aprendizaje del Diferente',
    instruction: '¿Cuál palabra no pertenece?',
    readAll: 'Leer Todo',
    hint: 'Pista',
    restart: 'Reiniciar',
    patternTips: 'Consejos de Patrones',
    listenRhyming: 'Escucha sonidos que riman',
    groupCategories: 'Agrupa por categorías',
    lookShapes: 'Mira las formas de las palabras',
    compareLengths: 'Compara longitudes',
    yourScores: 'Tus Puntuaciones Recientes',
    noScores: '¡Aún no hay puntuaciones. Juega algunas rondas para ver tu progreso!',
    currentStreak: 'Racha Actual',
    responseTime: 'Tiempo de Respuesta',
    accuracy: 'Precisión',
    complete: '¡Aprendizaje de Patrones Completo!',
    continue: 'Continuar Aprendiendo'
  },
  fr: {
    title: 'Apprentissage de l\'Intrus',
    instruction: 'Quel mot ne correspond pas?',
    readAll: 'Lire Tout',
    hint: 'Indice',
    restart: 'Redémarrer',
    patternTips: 'Conseils de Motifs',
    listenRhyming: 'Écoute les sons qui riment',
    groupCategories: 'Grouper par catégories',
    lookShapes: 'Regarde les formes des mots',
    compareLengths: 'Compare les longueurs',
    yourScores: 'Vos Scores Récents',
    noScores: 'Pas encore de scores. Jouez quelques manches pour voir vos progrès!',
    currentStreak: 'Série Actuelle',
    responseTime: 'Temps de Réponse',
    accuracy: 'Précision',
    complete: 'Apprentissage des Motifs Terminé!',
    continue: 'Continuer l\'Apprentissage'
  }
}

interface GameState {
  words: string[]
  correctAnswer: number
  selectedWord: number | null
  score: number
  round: number
  gameOver: boolean
  feedback: string
  showHint: boolean
  level: number
  currentHint: string
  soundEnabled: boolean
  streak: number
  startTime: number | null
  responseTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  timeLeft: number
}

const OddOneOutLearning: React.FC = () => {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    words: [],
    correctAnswer: -1,
    selectedWord: null,
    score: 0,
    round: 1,
    gameOver: false,
    feedback: '',
    showHint: false,
    level: 1,
    currentHint: '',
    soundEnabled: true,
    streak: 0,
    startTime: null,
    responseTime: 0,
    difficulty: 'medium',
    timeLeft: 15
  })
  const [, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [usedGroups, setUsedGroups] = useState<Set<number>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [language, setLanguage] = useState('en')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const { difficulty, soundEnabled, currentHint, streak, responseTime } = gameState
  const difficultyConfig = {
    easy: { rounds: DIFFICULTY_SETTINGS.easy.rounds, time: DIFFICULTY_SETTINGS.easy.time, multiplier: DIFFICULTY_SETTINGS.easy.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.easy.hintsEnabled },
    medium: { rounds: DIFFICULTY_SETTINGS.medium.rounds, time: DIFFICULTY_SETTINGS.medium.time, multiplier: DIFFICULTY_SETTINGS.medium.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.medium.hintsEnabled },
    hard: { rounds: DIFFICULTY_SETTINGS.hard.rounds, time: DIFFICULTY_SETTINGS.hard.time, multiplier: DIFFICULTY_SETTINGS.hard.scoreMultiplier, hintsEnabled: DIFFICULTY_SETTINGS.hard.hintsEnabled }
  } as const
  const maxRounds = difficultyConfig[gameState.difficulty].rounds

  const generateRound = (selectedDifficulty = gameState.difficulty) => {
    if (!user) return

    const adaptive = getAdaptiveDifficulty(user.email, 'wordRecognition')
    const level = adaptive.level

    const nextDiff = gameState.difficulty === 'easy' ? 'medium' : 'hard'
    const baseWords = getGameContent(gameState.difficulty, 4).map(item => item.word)
    const oddWord = getGameContent(nextDiff, 1)[0]?.word ?? baseWords[0]
    const generatedGroup = {
      pattern: [baseWords[0], baseWords[1], baseWords[2], oddWord],
      odd: 3,
      hint: gameState.difficulty === 'easy'
        ? 'Find the word that is different.'
        : gameState.difficulty === 'medium'
          ? 'Look for the word that does not fit this set.'
          : 'Find the tricky odd word with similar-looking distractors.'
    }

    // Keep legacy groups as fallback so existing behavior remains stable.
    let availableGroups = [generatedGroup, ...wordGroups]
    if (level <= 2) {
      availableGroups = [generatedGroup, ...wordGroups.filter((g: { pattern: string[] }) => g.pattern.every((word: string) => word.length <= 4))]
    } else if (level <= 4) {
      availableGroups = [generatedGroup, ...wordGroups.filter((g: { pattern: string[] }) => g.pattern.some((word: string) => word.length > 4))]
    } else {
      availableGroups = [generatedGroup, ...wordGroups.filter((g: { hint: string }) => g.hint.includes('emotions') || g.hint.includes('professions') || g.hint.includes('metals') || g.hint.includes('shapes'))]
    }

    // Avoid repeating same pattern consecutively [18]
    let groupIndex
    do {
      groupIndex = Math.floor(Math.random() * availableGroups.length)
    } while (usedGroups.has(groupIndex) && usedGroups.size < availableGroups.length)

    const group = availableGroups[groupIndex]
    setUsedGroups(prev => new Set([...prev, groupIndex]))

    const shuffledWords = [...group.pattern]

    let oddIndex = group.odd
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]]

      if (i === oddIndex) oddIndex = j
      else if (j === oddIndex) oddIndex = i
    }

    if (gameState.difficulty === 'hard' && shuffledWords.length > 0) {
      const candidateIndex = (oddIndex + 1) % shuffledWords.length
      const confusing = pickConfusingWord(shuffledWords[candidateIndex])
      if (confusing) shuffledWords[candidateIndex] = confusing
    }

    setGameState(prev => ({
      ...prev,
      words: shuffledWords,
      correctAnswer: oddIndex,
      selectedWord: null,
      feedback: '',
      showHint: false,
      level,
      currentHint: group.hint,
      startTime: Date.now(),
      responseTime: 0,
      difficulty: selectedDifficulty,
      timeLeft: difficultyConfig[selectedDifficulty].time
    }))

    if (gameState.soundEnabled) {
      speakText('Which word does not belong with the others?')
    }
  }

  const handleWordClick = (index: number) => {
    if (gameState.selectedWord !== null || gameState.words.length === 0 || isTransitioning) return // [4] Edge case handling

    const responseTime = gameState.startTime ? Date.now() - gameState.startTime : 0
    const isCorrect = index === gameState.correctAnswer
    const accuracy = isCorrect ? 1 : 0

    // Streak system [14]
    const newStreak = isCorrect ? gameState.streak + 1 : 0
    const scoreIncrease = isCorrect
      ? (1 + Math.floor(newStreak / 3)) * difficultyConfig[gameState.difficulty].multiplier
      : 0 // Bonus for streaks + difficulty multiplier

    if (user) {
      updateGameProgress(user.email, 'wordRecognition', {
        accuracy,
        reactionTime: responseTime,
        difficulty: gameState.level,
        timestamp: Date.now()
      })
    }

    // Prevent speech overlap [7]
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }

    setGameState(prev => ({
      ...prev,
      selectedWord: index,
      score: prev.score + scoreIncrease,
      feedback: isCorrect
        ? getEncouragingMessage(accuracy, true) + (newStreak > 1 ? ` Streak: ${newStreak}!` : '')
        : `Wrong! The odd one was "${prev.words[prev.correctAnswer]}"`,
      streak: newStreak,
      responseTime
    }))

    if (gameState.soundEnabled) {
      if (isCorrect) {
        speakText('Correct! You found the odd one out!')
      } else {
        speakText(`Not quite. The odd one was "${gameState.words[gameState.correctAnswer]}"`)
      }
    }

    setIsTransitioning(true)
    setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound(gameState.difficulty)
      }
      setIsTransitioning(false)
    }, 2500)
  }

  const showHint = () => {
    if (!difficultyConfig[gameState.difficulty].hintsEnabled) {
      setGameState(prev => ({ ...prev, feedback: 'Hints are disabled in Hard mode.' }))
      return
    }
    setGameState(prev => ({ ...prev, showHint: true }))
    if (gameState.soundEnabled) {
      speakText(gameState.currentHint)
    }
  }

  const readAllWords = () => {
    if (!gameState.soundEnabled) return
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    gameState.words.forEach((word, index) => {
      setTimeout(() => speakText(word), index * 800)
    })
  }

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      round: 1,
      score: 0,
      streak: 0,
      feedback: '',
      showHint: false,
      selectedWord: null,
      gameOver: false,
      startTime: Date.now(),
      responseTime: 0,
      timeLeft: difficultyConfig[prev.difficulty].time
    }))
    setUsedGroups(new Set())
    setScoreSaved(false)
    setHasStarted(false)
  }

  const loadLeaderboard = async () => {
    if (!user) return
    try {
      const scores = await getRecentScores(10, String(user.id))
      const oddOneOutScores = scores.filter((s: any) => s.game_name === 'odd-one-out')
      setLeaderboard(oddOneOutScores.slice(0, 5))
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  useEffect(() => {
    if (!user || !hasStarted) return
    generateRound()
  }, [user, hasStarted])

  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({
      ...prev,
      words: [],
      correctAnswer: -1,
      selectedWord: null,
      score: 0,
      round: 1,
      gameOver: false,
      feedback: '',
      showHint: false,
      streak: 0,
      responseTime: 0,
      difficulty: selectedDifficulty,
      timeLeft: difficultyConfig[selectedDifficulty].time
    }))
    setScoreSaved(false)
    setUsedGroups(new Set())
    setHasStarted(true)
    window.setTimeout(() => generateRound(selectedDifficulty), 0)
  }

  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard()
    }
  }, [showLeaderboard, user])

  useEffect(() => {
    if (!gameState.gameOver || !user || scoreSaved) return

    const saveScore = async () => {
      setSavingScore(true)
      try {
        await saveGameScore({
          userId: String(user.id),
          gameName: 'odd_one_out',
          difficulty: gameState.level.toString(),
          accuracy: Math.min(1, gameState.score / maxRounds),
          avgResponseTime: gameState.responseTime || 0,
          errors: {},
          score: gameState.score
        })
      } catch (error) {
        console.error('Failed to save odd one out score:', error)
        // Don't show error to user, just log it
      } finally {
        setSavingScore(false)
        setScoreSaved(true)
      }
    }

    saveScore()
  }, [gameState.gameOver, user, scoreSaved, gameState.score, gameState.level])

  useEffect(() => {
    if (gameState.gameOver || gameState.selectedWord !== null || gameState.timeLeft <= 0 || !gameState.words.length) return
    const timer = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [gameState.gameOver, gameState.selectedWord, gameState.timeLeft, gameState.words.length])

  useEffect(() => {
    if (gameState.gameOver || gameState.timeLeft > 0 || !gameState.words.length || isTransitioning) return
    setIsTransitioning(true)
    setGameState(prev => ({
      ...prev,
      selectedWord: prev.correctAnswer,
      feedback: `⏰ Time's up! The odd one was "${prev.words[prev.correctAnswer]}"`
    }))
    const timeout = window.setTimeout(() => {
      if (gameState.round >= maxRounds) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      } else {
        setGameState(prev => ({ ...prev, round: prev.round + 1 }))
        generateRound(gameState.difficulty)
      }
      setIsTransitioning(false)
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [gameState.timeLeft, gameState.gameOver, gameState.words.length, gameState.round, maxRounds, gameState.difficulty, isTransitioning])

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Search className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{translations[language as keyof typeof translations].complete}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Score: {gameState.score}/{maxRounds} • Level: {gameState.level}</p>
          <button onClick={resetGame} className="btn btn-primary w-full">{translations[language as keyof typeof translations].continue}</button>
        </motion.div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div className="card p-8 text-center max-w-md w-full">
          <Search className="w-16 h-16 text-green-500 mx-auto mb-4" />
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="w-full xl:flex-1 max-w-4xl mx-auto xl:mx-0">
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{translations[language as keyof typeof translations].title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-semibold">Level {gameState.level}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-semibold">{gameState.score}/{maxRounds}</span>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-semibold capitalize">{difficulty}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">{gameState.timeLeft}s</span>
              </div>
              <button onClick={toggleSound} className="btn btn-ghost btn-sm">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="btn btn-ghost btn-sm text-sm"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
              </select>
              <button onClick={resetGame} className="btn btn-outline btn-sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                {translations[language as keyof typeof translations].restart}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Round {gameState.round} of {maxRounds}</span>
              <span>{Math.round((gameState.round / maxRounds) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div 
                className="bg-primary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(gameState.round / maxRounds) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-primary-600">{translations[language as keyof typeof translations].instruction}</p>
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
            <div className="flex justify-center space-x-4 mt-4">
              <button onClick={readAllWords} className="btn btn-outline btn-sm">
                <Volume2 className="w-4 h-4 mr-2" />
                {translations[language as keyof typeof translations].readAll}
              </button>
              <button onClick={showHint} className="btn btn-ghost btn-sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                {translations[language as keyof typeof translations].hint}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl mx-auto place-items-stretch">
            {gameState.words.map((word, index) => {
              const isSelected = gameState.selectedWord === index
              const isCorrect = index === gameState.correctAnswer
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleWordClick(index)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all relative flex items-center justify-center p-4 sm:p-6 text-xl sm:text-2xl font-bold ${
                    isSelected 
                      ? isCorrect 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400 text-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
                  }`}
                  whileHover={!isSelected ? { scale: 1.02 } : {}}
                  animate={isSelected ? (isCorrect ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : { scale: [1, 0.9, 1], x: [-10, 10, -10, 10, 0] }) : {}}
                  transition={{ duration: 0.5 }}
                  disabled={gameState.selectedWord !== null}
                >
                  {word}
                  
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); speakText(word) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        speakText(word)
                      }
                    }}
                    className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-75 hover:opacity-100 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </span>
                </motion.button>
              )
            })}
          </div>
          
          {/* Live Metrics */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{streak}</div>
              <div className="text-sm text-blue-700">{translations[language as keyof typeof translations].currentStreak}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{responseTime ? `${responseTime}ms` : '--'}</div>
              <div className="text-sm text-green-700">{translations[language as keyof typeof translations].responseTime}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{gameState.round > 1 ? Math.round(((gameState.score / (gameState.round - 1)) * 100)) : 0}%</div>
              <div className="text-sm text-purple-700">{translations[language as keyof typeof translations].accuracy}</div>
            </div>
          </div>
          
          {gameState.showHint && (
            <motion.div 
              className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              💡 {currentHint}
            </motion.div>
          )}
          
          {gameState.feedback && (
            <motion.div 
              className="mt-8 p-4 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {gameState.feedback}
            </motion.div>
          )}
        </div>

        <div className="card p-4 mt-6">
          <h4 className="font-semibold text-sm mb-2">💡 {translations[language as keyof typeof translations].patternTips}:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 p-2 rounded">🎵 {translations[language as keyof typeof translations].listenRhyming}</div>
            <div className="bg-green-50 p-2 rounded">🏷️ {translations[language as keyof typeof translations].groupCategories}</div>
            <div className="bg-purple-50 p-2 rounded">👀 {translations[language as keyof typeof translations].lookShapes}</div>
            <div className="bg-orange-50 p-2 rounded">📏 {translations[language as keyof typeof translations].compareLengths}</div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="card p-4 mt-6">
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full flex items-center justify-between font-semibold text-sm mb-2"
          >
            🏆 {translations[language as keyof typeof translations].yourScores}
            <span className="text-xs">{showLeaderboard ? '▼' : '▶'}</span>
          </button>
          {showLeaderboard && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {leaderboard.length > 0 ? (
                leaderboard.map((score, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                    <div className="flex items-center">
                      <span className="font-bold mr-2">#{index + 1}</span>
                      <span>{new Date(score.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{score.score}/5</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{score.difficulty}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                  {translations[language as keyof typeof translations].noScores}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="w-full xl:w-96 xl:flex-shrink-0 mx-auto xl:mx-0">
        <CameraTracker
          userId={String(user?.id || user?.email || 'guest')}
          gameScore={gameState.score}
          gameName="odd-one-out"
          difficulty={gameState.difficulty}
          totalQuestions={maxRounds}
          isGamePage={true}
          errors={[]}
        />
      </div>
      </div>
      </div>
    </div>
  )
}

export default OddOneOutLearning