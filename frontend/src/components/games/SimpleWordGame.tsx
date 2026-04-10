import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Brain } from 'lucide-react'

const SimpleWordGame: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(10)
  const [gameComplete, setGameComplete] = useState(false)
  const navigate = useNavigate()

  const words = ['cat', 'dog', 'sun', 'car', 'run', 'big', 'red', 'hat', 'cup', 'pen']

  useEffect(() => {
    if (gameStarted && currentRound < 5 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleNextRound()
    }
  }, [timeLeft, gameStarted, currentRound])

  const startGame = () => {
    setGameStarted(true)
    generateQuestion()
  }

  const generateQuestion = () => {
    const correctWord = words[Math.floor(Math.random() * words.length)]
    const wrongWords = words.filter(w => w !== correctWord).slice(0, 3)
    const allOptions = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5)
    
    setCurrentWord(correctWord)
    setOptions(allOptions)
    setTimeLeft(10)
  }

  const handleAnswer = (selectedWord: string) => {
    if (selectedWord === currentWord) {
      setScore(score + 1)
    }
    handleNextRound()
  }

  const handleNextRound = () => {
    if (currentRound + 1 >= 5) {
      completeGame()
    } else {
      setCurrentRound(currentRound + 1)
      generateQuestion()
    }
  }

  const completeGame = () => {
    setGameComplete(true)
    
    // Save result to localStorage for admin analytics
    const result = {
      id: Date.now().toString(),
      userId: 'user-' + Date.now(),
      username: 'Player',
      gameType: 'word-recognition',
      gameName: 'Word Recognition',
      difficulty: 'easy',
      score: score,
      totalQuestions: 5,
      hasDyslexia: score < 4,
      completedAt: new Date().toISOString()
    }
    
    const results = JSON.parse(localStorage.getItem('gameResults') || '[]')
    results.push(result)
    localStorage.setItem('gameResults', JSON.stringify(results))
  }

  const restartGame = () => {
    setCurrentRound(0)
    setScore(0)
    setGameStarted(true)
    setGameComplete(false)
    setTimeLeft(10)
    generateQuestion()
    console.log('SimpleWordGame restarted')
  }

  const handleBack = () => {
    navigate('/games')
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen gradient-bg">
        <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">DysLexia Support</span>
              </div>
              <button onClick={handleBack} className="btn btn-outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4">Word Recognition Game</h1>
            <p className="text-gray-600 text-center mb-8">
              Test your ability to quickly identify and match words
            </p>
            <button onClick={startGame} className="btn btn-primary btn-lg">
              Start Game (5 rounds)
            </button>
          </div>
        </div>
      </div>
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
            <div className="text-6xl font-bold text-primary-600 mb-4">{score}/5</div>
            <p className="text-xl text-gray-600 mb-8">
              {score >= 4 ? '✅ Excellent performance!' : score >= 3 ? '👍 Good job!' : '💪 Keep practicing!'}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={restartGame} className="btn btn-primary">
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
              <p className="text-sm text-gray-600">Round {currentRound + 1}/5</p>
              <p className="text-lg font-semibold">Score: {score}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentRound / 5) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Time left: {timeLeft}s
          </div>
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-8">Which word do you see?</h2>
          
          <div className="text-5xl font-bold mb-12 text-primary-600 p-6 bg-primary-50 rounded-xl">
            {currentWord}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className="btn btn-outline h-16 text-lg hover:bg-primary-50 hover:border-primary-500 transition-all duration-200"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleWordGame