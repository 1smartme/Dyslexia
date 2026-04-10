import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GameTopNav from '../components/games/GameTopNav'
import WordRecognitionLearning from '../components/games/WordRecognitionLearning'
import LetterSequencingLearning from '../components/games/LetterSequencingLearning'
import ReadingComprehensionLearning from '../components/games/ReadingComprehensionLearning'
import LetterMirrorLearning from '../components/games/LetterMirrorLearning'
import SpeedWordsLearning from '../components/games/SpeedWordsLearning'
import SoundTwinsLearning from '../components/games/SoundTwinsLearning'
import BuildWordLearning from '../components/games/BuildWordLearning'
import OddOneOutLearning from '../components/games/OddOneOutLearning'

const GamePage: React.FC = () => {
  const { gameType } = useParams<{ gameType: string }>()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [gameType])

  if (isAdmin) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">Admin users cannot play games. Please use the admin dashboard to view user results.</p>
          <Link to="/admin" className="btn btn-primary">
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const renderGame = () => {
    switch (gameType) {
      case 'word-recognition-learning':
        return <WordRecognitionLearning />
      
      case 'letter-sequencing-learning':
        return <LetterSequencingLearning />
      
      case 'reading-comprehension-learning':
        return <ReadingComprehensionLearning />
      
      case 'letter-mirror-learning':
        return <LetterMirrorLearning />
      
      case 'speed-words-learning':
        return <SpeedWordsLearning />
      
      case 'sound-twins-learning':
        return <SoundTwinsLearning />
      
      case 'build-word-learning':
        return <BuildWordLearning />
      
      case 'odd-one-out-learning':
        return <OddOneOutLearning />
      
      default:
        return <WordRecognitionLearning />
    }
  }

  return (
    <div className="min-h-screen">
      <GameTopNav />
      {renderGame()}
    </div>
  )
}

export default GamePage