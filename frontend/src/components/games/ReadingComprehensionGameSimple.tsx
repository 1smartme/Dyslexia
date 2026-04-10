import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Brain, BookOpen } from 'lucide-react'

const ReadingComprehensionGameSimple: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [gameComplete, setGameComplete] = useState(false)
  const navigate = useNavigate()

  const questions = [
    {
      passage: "The cat sat on the mat. It was a sunny day. The cat was happy and warm.",
      question: "Where did the cat sit?",
      options: ["On the chair", "On the mat", "On the bed", "On the floor"],
      correctAnswer: 1
    },
    {
      passage: "Tom has a red ball. He likes to play with it in the park. The ball bounces high.",
      question: "What color is Tom's ball?",
      options: ["Blue", "Green", "Red", "Yellow"],
      correctAnswer: 2
    },
    {
      passage: "The dog runs fast. It has four legs and a long tail. The dog is brown.",
      question: "How many legs does the dog have?",
      options: ["Two", "Three", "Four", "Five"],
      correctAnswer: 2
    },
    {
      passage: "Sara eats an apple. The apple is sweet and red. She likes apples very much.",
      question: "What does Sara eat?",
      options: ["Orange", "Apple", "Banana", "Grape"],
      correctAnswer: 1
    },
    {
      passage: "The sun is bright today. Birds are singing in the trees. It is a beautiful morning.",
      question: "What are the birds doing?",
      options: ["Flying", "Sleeping", "Singing", "Eating"],
      correctAnswer: 2
    }
  ]

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
    const question = questions[currentRound % questions.length]
    setCurrentQuestion(question)
    setTimeLeft(20)
  }

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === currentQuestion.correctAnswer) {
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
      gameType: 'reading-comprehension',
      gameName: 'Reading Comprehension',
      difficulty: 'moderate',
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
    setTimeLeft(20)
    generateQuestion()
    console.log('ReadingComprehensionGameSimple restarted')
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
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-6 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4">Reading Comprehension Game</h1>
            <p className="text-gray-600 text-center mb-8">
              Read passages and answer questions to test your understanding
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
              {score >= 4 ? '✅ Excellent comprehension!' : score >= 3 ? '👍 Good reading skills!' : '💪 Keep practicing!'}
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

  if (!currentQuestion) return null

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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentRound / 5) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Time left: {timeLeft}s
          </div>
        </div>

        <div className="card p-8">
          {/* Passage */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Read the passage:</h2>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-primary-500">
              <p className="text-lg leading-relaxed">{currentQuestion.passage}</p>
            </div>
          </div>
          
          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
                >
                  <span className="font-semibold text-primary-600 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingComprehensionGameSimple