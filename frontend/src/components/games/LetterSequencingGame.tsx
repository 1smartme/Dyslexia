import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

interface LetterSequencingGameProps {
  onGameComplete?: (score: number) => void
}

const LetterSequencingGame: React.FC<LetterSequencingGameProps> = ({ onGameComplete }) => {
  const [difficulty, setDifficulty] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [userAnswer, setUserAnswer] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameComplete, setGameComplete] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()

  const mirrorEligible = ['b', 'd', 'p', 'q', 'm', 'w']

  const wordSets = {
    easy: ['cat', 'dog', 'sun', 'car', 'run', 'big', 'red', 'hat', 'cup', 'pen'],
    moderate: ['house', 'water', 'happy', 'green', 'table', 'phone', 'smile', 'paper', 'light', 'music'],
    difficult: ['elephant', 'beautiful', 'computer', 'vacation', 'chemistry', 'telephone', 'paragraph', 'wonderful', 'dangerous', 'mountain']
  }

  useEffect(() => {
    if (gameStarted && currentRound < 10 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleNextRound()
    }
  }, [timeLeft, gameStarted, currentRound])

  const startGame = (selectedDifficulty: string) => {
    setDifficulty(selectedDifficulty)
    setGameStarted(true)
    setUsedWords([])
    generateQuestion(selectedDifficulty)
  }

  const generateQuestion = (diff: string) => {
    const words = wordSets[diff as keyof typeof wordSets]
    const availableWords = words.filter(word => !usedWords.includes(word))
    const wordsToUse = availableWords.length > 0 ? availableWords : words
    const correctWord = wordsToUse[Math.floor(Math.random() * wordsToUse.length)]

    const letters = correctWord.split('')

    // Add two mirror-image letters based on letters from the correct word
    const mirrorMap: Record<string, string> = {
      b: 'd',
      d: 'b',
      p: 'q',
      q: 'p',
      m: 'w',
      w: 'm',
      n: 'u',
      u: 'n'
    }

    const uniqueLower = Array.from(new Set(letters.map(l => l.toLowerCase())))
    const eligible = uniqueLower.filter(l => mirrorMap[l])

    const selectedMirrors: string[] = []
    if (eligible.length >= 2) {
      // pick two different eligible letters at random
      while (selectedMirrors.length < 2) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)]
        if (!selectedMirrors.includes(pick)) selectedMirrors.push(pick)
      }
    } else if (eligible.length === 1) {
      // only one eligible letter in word: pick it and duplicate its mirror once
      selectedMirrors.push(eligible[0])
      selectedMirrors.push(eligible[0])
    } else {
      // no eligible letters found: as a fallback, pick up to two random letters from the word
      const picks: string[] = []
      while (picks.length < 2 && picks.length < uniqueLower.length) {
        const pick = uniqueLower[Math.floor(Math.random() * uniqueLower.length)]
        if (!picks.includes(pick)) picks.push(pick)
      }
      selectedMirrors.push(...picks)
    }

    // Create mirror characters (preserve original case if possible)
    const mirrorsToAdd: string[] = selectedMirrors.map(s => {
      const lower = s.toLowerCase()
      const mirrored = mirrorMap[lower]
      if (!mirrored) return s // fallback to original letter if no mapping
      // match case of original occurrence in the word (prefer first occurrence)
      const orig = letters.find(l => l.toLowerCase() === lower) || s
      const isUpper = orig === orig.toUpperCase()
      return isUpper ? mirrored.toUpperCase() : mirrored
    })

    const scrambled = [...letters, ...mirrorsToAdd].sort(() => Math.random() - 0.5)

    setCurrentWord(correctWord)
    setScrambledLetters(scrambled)
    setUserAnswer([])
    setUsedWords(prev => [...prev, correctWord])
    setTimeLeft(15)
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

  const getLetterDisplayGroups = () => {
    const mirrorMap: Record<string, string> = {
      b: 'd', d: 'b', B: 'D', D: 'B',
      p: 'q', q: 'p', P: 'Q', Q: 'P',
      m: 'w', w: 'm', M: 'W', W: 'M',
      n: 'u', u: 'n', N: 'U', U: 'N'
    }

    const groups: Array<{ letters: string[], indices: number[] }> = []
    const usedIndices = new Set<number>()

    scrambledLetters.forEach((letter, index) => {
      if (usedIndices.has(index)) return

      const mirror = mirrorMap[letter]
      const mirrorIndex = mirror 
        ? scrambledLetters.findIndex(
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

  const handleSubmit = () => {
    const userWord = userAnswer.join('')
    const isCorrect = userWord.toLowerCase() === currentWord.toLowerCase()

    if (isCorrect) {
      setScore(score + 1)
      toast.success('Correct! 🎉')
    } else {
      toast.error(`Incorrect. Correct word was "${currentWord}"`)
    }

    handleNextRound()
  }

  const handleNextRound = () => {
    if (currentRound + 1 >= 10) {
      completeGame()
    } else {
      setCurrentRound(currentRound + 1)
      generateQuestion(difficulty!)
    }
  }

  const completeGame = () => {
    setGameComplete(true)
    const result = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      username: user?.email?.split('@')[0] || 'Anonymous',
      gameType: 'letter-sequencing',
      gameName: 'Letter Sequencing',
      difficulty: difficulty!,
      score,
      totalQuestions: 10,
      hasDyslexia: score < 7,
      completedAt: new Date().toISOString()
    }

    const results = JSON.parse(localStorage.getItem('gameResults') || '[]')
    results.push(result)
    localStorage.setItem('gameResults', JSON.stringify(results))

    if (onGameComplete) onGameComplete(score)
  }

  if (!difficulty) {
    return (
      <div className="min-h-screen gradient-bg p-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate('/games')} className="btn btn-outline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="card p-8 space-y-4">
            <button onClick={() => startGame('easy')} className="btn bg-green-500 text-white w-full">
              Easy
            </button>
            <button onClick={() => startGame('moderate')} className="btn bg-yellow-500 text-white w-full">
              Moderate
            </button>
            <button onClick={() => startGame('difficult')} className="btn bg-red-500 text-white w-full">
              Difficult
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen gradient-bg p-4 text-center">
        <h1 className="text-4xl font-bold">Game Complete!</h1>
        <p className="text-2xl mt-4">Score: {score}/10</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-2xl mx-auto card p-8">

        <div className="flex justify-between mb-4">
          <span>Round {currentRound + 1}/10</span>
          <span>Score: {score}</span>
        </div>

        <div className="text-center mb-4">
          <Clock className="inline w-4 h-4 mr-1" />
          {timeLeft}s
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: currentWord.length }).map((_, i) => (
            <div key={i} onClick={() => userAnswer[i] && handleRemoveLetter(i)}
              className="w-12 h-12 border rounded flex items-center justify-center font-bold text-xl bg-white">
              {userAnswer[i] || ''}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 flex-wrap mb-6">
          {getLetterDisplayGroups().map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-1 items-center">
              {group.letters.map((letter, letterIndex) => (
                <button
                  key={`${letter}-${group.indices[letterIndex]}`}
                  onClick={() => handleLetterClick(letter, group.indices[letterIndex])}
                  className="w-12 h-12 bg-primary-100 border border-gray-300 rounded text-xl font-bold hover:bg-primary-200 transition-all"
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            disabled={userAnswer.length !== currentWord.length}
            onClick={handleSubmit}
            className="btn btn-primary"
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  )
}

export default LetterSequencingGame