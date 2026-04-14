import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { gameConfigs, GameLevel } from '../../lib/gameConfig'
import LevelSelector from './LevelSelector'

interface ReadingComprehensionGameProps {
  onGameComplete?: (score: number) => void
}

interface Question {
  passage: string
  question: string
  options: string[]
  correctAnswer: number
}

const ReadingComprehensionGame: React.FC<ReadingComprehensionGameProps> = ({ onGameComplete }) => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameComplete, setGameComplete] = useState(false)
  const [usedQuestions, setUsedQuestions] = useState<number[]>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const gameConfig = gameConfigs['reading-comprehension-learning']

  const questionSets = {
    beginner: [
      {
        passage: "The cat sat on the mat. It was a sunny day.",
        question: "Where did the cat sit?",
        options: ["On the chair", "On the mat", "On the bed", "On the floor"],
        correctAnswer: 1
      },
      {
        passage: "Tom has a red ball. He likes to play with it.",
        question: "What color is Tom's ball?",
        options: ["Blue", "Green", "Red", "Yellow"],
        correctAnswer: 2
      }
    ],
    easy: [
      {
        passage: "Sara walked to the park. She saw many flowers and birds singing in the trees. The sun was shining brightly.",
        question: "What was Sara doing?",
        options: ["Running", "Walking to the park", "Swimming", "Reading"],
        correctAnswer: 1
      },
      {
        passage: "The library has many books. Children come here to read stories. It is quiet and peaceful.",
        question: "What do children do at the library?",
        options: ["Play games", "Watch movies", "Read stories", "Eat lunch"],
        correctAnswer: 2
      }
    ],
    moderate: [
      {
        passage: "Emma walked through the forest path. The tall trees created shadows on the ground. She could hear birds chirping and leaves rustling in the gentle breeze. After walking for an hour, she reached a beautiful clearing with wildflowers.",
        question: "How long did Emma walk before reaching the clearing?",
        options: ["30 minutes", "45 minutes", "One hour", "Two hours"],
        correctAnswer: 2
      },
      {
        passage: "The local library was built in 1892 and has served the community for over a century. It contains thousands of books, magazines, and digital resources. The library also offers computer classes and reading programs for children.",
        question: "When was the library built?",
        options: ["1882", "1892", "1902", "1912"],
        correctAnswer: 1
      }
    ],
    hard: [
      {
        passage: "The Renaissance period, spanning roughly from the 14th to the 17th century, marked a profound transformation in European culture, art, and intellectual thought. This era witnessed unprecedented achievements in literature, with writers like Shakespeare and Dante creating works that continue to influence modern literature. The period also saw remarkable advances in scientific understanding, as figures like Galileo and Copernicus challenged traditional views of the universe.",
        question: "According to the passage, what did Galileo and Copernicus challenge?",
        options: ["Literary traditions", "Artistic conventions", "Traditional views of the universe", "Political systems"],
        correctAnswer: 2
      }
    ]
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
    setUsedQuestions([])
    setGameStartTime(Date.now())
    generateQuestion(level)
  }

  const generateQuestion = (level: GameLevel) => {
    const questions = questionSets[level.id as keyof typeof questionSets]
    const availableQuestions = questions.filter((_, index) => !usedQuestions.includes(index))
    
    if (availableQuestions.length === 0) {
      setUsedQuestions([])
    }
    
    const questionsToUse = availableQuestions.length > 0 ? availableQuestions : questions
    const randomIndex = Math.floor(Math.random() * questionsToUse.length)
    const selectedQuestion = questionsToUse[randomIndex]
    
    setCurrentQuestion(selectedQuestion)
    setUsedQuestions(prev => [...prev, questions.indexOf(selectedQuestion)])
    setTimeLeft(level.timeLimit || 30)
  }

  const handleAnswer = (selectedIndex: number) => {
    if (!currentQuestion) return
    
    const isCorrect = selectedIndex === currentQuestion.correctAnswer
    
    if (isCorrect) {
      setScore(score + 1)
      toast.success('Correct! Well done! 🎉')
    } else {
      toast.error(`Incorrect. The correct answer was "${currentQuestion.options[currentQuestion.correctAnswer]}"`)
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
      userId: user?.id || 'anonymous',
      username: user?.email?.split('@')[0] || 'Anonymous',
      gameType: 'reading-comprehension',
      gameName: 'Reading Comprehension',
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
    
    const passed = score >= selectedLevel.passingScore
    toast.success(`Game Complete! You scored ${score}/${selectedLevel.questionsCount}`, {
      description: passed ? 'Great job! No signs of dyslexia detected.' : 'You might benefit from further assessment.'
    })
    
    if (onGameComplete) {
      onGameComplete(score)
    }
  }

  const restartGame = () => {
    if (!selectedLevel) return
    setCurrentRound(0)
    setScore(0)
    setGameComplete(false)
    setGameStarted(true)
    setUsedQuestions([])
    setTimeLeft(selectedLevel.timeLimit || 30)
    generateQuestion(selectedLevel)
    console.log('ReadingComprehensionGame restarted')
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
      <div className="min-h-screen gradient-bg p-4">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">🎉 Game Complete!</h1>
            
            <div className="mb-8">
              <div className="text-6xl font-bold text-primary-600 mb-2">{score}/{selectedLevel.questionsCount}</div>
              <p className="text-xl text-gray-600 mb-4">
                {score >= selectedLevel.passingScore ? '✅ Great job! No signs of dyslexia detected.' : '⚠️ You might benefit from further assessment.'}
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
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <button onClick={restartGame} className="btn btn-primary">
                Play Again
              </button>
              <button onClick={() => navigate('/games')} className="btn btn-default">
                Explore More Games
              </button>
              <button onClick={() => navigate('/profile')} className="btn btn-outline">
                View Profile
              </button>
              <button 
                onClick={handleBack}
                className="btn btn-outline"
              >
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
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Reading Comprehension - {selectedLevel.name}</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Round {currentRound + 1}/{selectedLevel.questionsCount}</p>
              <p className="text-lg font-semibold">Score: {score}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="progress-bar h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentRound / selectedLevel.questionsCount) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Time left: {timeLeft}s
          </div>
        </div>

        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Read the passage:</h2>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-primary-500">
              <p className="text-lg leading-relaxed font-dyslexic">{currentQuestion.passage}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 font-dyslexic">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 font-dyslexic"
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

export default ReadingComprehensionGame