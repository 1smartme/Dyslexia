import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Target, Clock, Trophy, Star } from 'lucide-react'
import { GameLevel, getDifficultyBadgeColor } from '../../lib/gameConfig'
import GameTopNav from './GameTopNav'

interface LevelSelectorProps {
  gameTitle: string
  gameDescription: string
  levels: GameLevel[]
  onLevelSelect: (level: GameLevel) => void
  onBack: () => void
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  gameTitle,
  gameDescription,
  levels,
  onLevelSelect,
  onBack
}) => {
  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <GameTopNav />
        <button 
          onClick={onBack}
          className="btn btn-outline mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </button>
        
        <motion.div 
          className="card p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-center mb-4">{gameTitle}</h1>
          <p className="text-gray-600 text-center text-lg mb-8">
            {gameDescription}
          </p>
          
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              ✨ Choose your difficulty level to begin
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {levels.map((level, index) => (
            <motion.div
              key={level.id}
              role="button"
              tabIndex={0}
              onClick={() => onLevelSelect(level)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onLevelSelect(level)
                }
              }}
              className={`card card-hover p-6 bg-gradient-to-br ${level.bgColor} border-0 relative overflow-hidden group cursor-pointer min-h-[360px] flex flex-col justify-between`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-16 h-16 bg-gradient-to-r ${level.color} rounded-2xl mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Target className="w-8 h-8 text-white" />
                  </div>

                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {level.name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyBadgeColor(level.difficulty)}`}>
                      {level.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {level.description}
                  </p>

                  <div className="space-y-3 mb-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {level.timeLimit ? `${level.timeLimit}s per question` : 'No time limit'}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      {level.questionsCount} questions
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-2" />
                      Pass: {level.passingScore}/{level.questionsCount}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn w-full bg-gradient-to-r ${level.color} text-white hover:shadow-lg transform transition-all duration-300 group-hover:scale-105 border-0 mt-4`}
                >
                  Start Level
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="card p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            💡 Level Selection Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>New to this game?</strong> Start with Beginner or Easy level to get familiar with the format.
            </div>
            <div>
              <strong>Want a challenge?</strong> Try Moderate or Hard levels for more comprehensive assessment.
            </div>
            <div>
              <strong>Time pressure?</strong> Higher levels have shorter time limits to test processing speed.
            </div>
            <div>
              <strong>Accurate results?</strong> Complete multiple levels for a more thorough evaluation.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LevelSelector