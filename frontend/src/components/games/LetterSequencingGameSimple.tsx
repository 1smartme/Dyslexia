import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Brain, Shuffle } from 'lucide-react'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'

const LetterSequencingGameSimple: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameComplete, setGameComplete] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const navigate = useNavigate()

  const mirrorEligible = ['b', 'd', 'p', 'q', 'm', 'w']
  
  const gameConfig = gameConfigs['letter-sequencing']

  const wordSets = {
    beginner: ['cat', 'dog', 'sun', 'car', 'run', 'big', 'red', 'hat', 'cup', 'pen'],
    easy: ['house', 'water', 'happy', 'green', 'table', 'phone', 'smile', 'paper', 'light', 'music'],
    moderate: ['elephant', 'beautiful', 'computer', 'vacation', 'chemistry', 'telephone', 'paragraph', 'wonderful', 'dangerous', 'mountain'],
    hard: ['extraordinary', 'sophisticated', 'revolutionary', 'incomprehensible', 'pharmaceutical', 'archaeological', 'entrepreneurial', 'constitutional', 'environmental', 'psychological']
  }

  useEffect(() => {
    if (gameStarted && selectedLevel && currentRound < selectedLevel.questionsCount && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleNextRound()
    }
  }, [timeLeft, gameStarted, currentRound, selectedLevel])

  const startGame = (level: GameLevel) => {
    setSelectedLevel(level)
    setGameStarted(true)
    setUsedWords([])
    setGameStartTime(Date.now())
    generateQuestion(level)
  }

  const generateQuestion = (level: GameLevel) => {
    const words = wordSets[level.id as keyof typeof wordSets]
    const availableWords = words.filter(word => !usedWords.includes(word))
    
    if (availableWords.length === 0) {
      setUsedWords([])
    }
    
    const wordsToUse = availableWords.length > 0 ? availableWords : words
    const correctWord = wordsToUse[Math.floor(Math.random() * wordsToUse.length)]
    const letters = correctWord.split('')
    const scrambled = [...letters].sort(() => Math.random() - 0.5)

  
    
    setCurrentWord(correctWord)
    setScrambledLetters(scrambled)
    setUserAnswer([])
    setUsedWords(prev => [...prev, correctWord])
    setTimeLeft(level.timeLimit || 15)
  }

  const handleLetterClick = (letter: string, index: number) => {
    if (userAnswer.length < currentWord.length) {
      setUserAnswer([...userAnswer, letter])
      setScrambledLetters(scrambledLetters.filter((_, i) => i !== index))
    }
  }

  const handleRemoveLetter = (index: number) => {
    const removedLetter = userAnswer[index]
    setUserAnswer(userAnswer.filter((_, i) => i !== index))
    setScrambledLetters([...scrambledLetters, removedLetter])
  }

  const handleSubmit = () => {
    const userWord = userAnswer.join('')
    if (userWord.toLowerCase() === currentWord.toLowerCase()) {
      setScore(score + 1)
    }
    handleNextRound()
  }

  const handleNextRound = () => {
    if (!selectedLevel) return
    
    if (currentRound + 1 >= selectedLevel.questionsCount) {
      completeGame()
    } else {
      setCurrentRound(currentRound + 1)
      generateQuestion(selectedLevel)
    }
  }

  const completeGame = () => {
    if (!selectedLevel) return
    
    setGameComplete(true)
    const gameEndTime = Date.now()
    const gameDurationSeconds = Math.floor((gameEndTime - gameStartTime) / 1000)
    
    const result = {
      id: Date.now().toString(),
      userId: 'user-' + Date.now(),
      username: 'Player',
      gameType: 'letter-sequencing',
      gameName: 'Letter Sequencing',
      difficulty: selectedLevel.difficulty,
      level: selectedLevel.name,
      score: score,
      totalQuestions: selectedLevel.questionsCount,
      hasDyslexia: score < selectedLevel.passingScore,
      completedAt: new Date().toISOString(),
      durationSeconds: gameDurationSeconds
    }
    
    const results = JSON.parse(localStorage.getItem('gameResults') || '[]')
    results.push(result)
    localStorage.setItem('gameResults', JSON.stringify(results))
  }

  const handleBack = () => {
    navigate('/games')
  }

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

  if (gameComplete) {
    return (
      <div className="min-h-screen gradient-bg">
        <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">DysLexia Support</span>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">🎉 Game Complete!</h1>
            <div className="text-6xl font-bold text-primary-600 mb-4">{score}/{selectedLevel.questionsCount}</div>
            <p className="text-xl text-gray-600 mb-4">
              {score >= selectedLevel.passingScore ? '✅ Excellent sequencing skills!' : '💪 Keep practicing!'}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Level:</span> {selectedLevel.name}
                </div>
                <div>
                  <span className="font-semibold">Accuracy:</span> {Math.round((score / selectedLevel.questionsCount) * 100)}%
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Play Again
              </button>
              <button onClick={handleBack} className="btn btn-outline">
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">DysLexia Support</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Round {currentRound + 1}/{selectedLevel.questionsCount}</p>
              <p className="text-lg font-semibold">Score: {score}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentRound / selectedLevel.questionsCount) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Time left: {timeLeft}s
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Arrange the letters to form a word - {selectedLevel.name}
          </h2>
          
          {/* User Answer Area */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Your Answer:</h3>
            <div className="flex justify-center gap-2 mb-4 min-h-[60px] items-center">
              {Array.from({ length: currentWord.length }).map((_, index) => (
                <div
                  key={index}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold bg-white cursor-pointer hover:bg-gray-50"
                  onClick={() => userAnswer[index] && handleRemoveLetter(index)}
                >
                  {userAnswer[index] || ''}
                </div>
              ))}
            </div>
          </div>
          
          {/* Scrambled Letters */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Available Letters:</h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {scrambledLetters.map((letter, index) => (
                <button
                  key={index}
                  onClick={() => handleLetterClick(letter, index)}
                  className="w-12 h-12 bg-primary-100 hover:bg-primary-200 border-2 border-primary-300 rounded-lg text-xl font-bold transition-all duration-200"
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={userAnswer.length !== currentWord.length}
              className="btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LetterSequencingGameSimple