export interface GameLevel {
  id: string
  name: string
  description: string
  difficulty: 'Beginner' | 'Easy' | 'Moderate' | 'Hard' | 'Expert'
  timeLimit?: number
  questionsCount: number
  passingScore: number
  color: string
  bgColor: string
}

export interface GameConfig {
  id: string
  title: string
  description: string
  icon: string
  levels: GameLevel[]
  estimatedDuration: string
  category: 'reading' | 'visual' | 'auditory' | 'cognitive'
}

export const gameConfigs: Record<string, GameConfig> = {
  'word-recognition-learning': {
    id: 'word-recognition-learning',
    title: 'Word Recognition',
    description: 'Test your ability to quickly identify and match words',
    icon: 'BookOpen',
    category: 'reading',
    estimatedDuration: '10-15 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: '2-3 letter words, basic vocabulary',
        difficulty: 'Beginner',
        timeLimit: 15,
        questionsCount: 8,
        passingScore: 6,
        color: 'from-green-400 to-green-600',
        bgColor: 'from-green-50 to-green-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: '3-4 letter words, common vocabulary',
        difficulty: 'Easy',
        timeLimit: 12,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-blue-400 to-blue-600',
        bgColor: 'from-blue-50 to-blue-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: '5-6 letter words, everyday vocabulary',
        difficulty: 'Moderate',
        timeLimit: 10,
        questionsCount: 12,
        passingScore: 8,
        color: 'from-yellow-400 to-orange-500',
        bgColor: 'from-yellow-50 to-orange-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: '7+ letter words, advanced vocabulary',
        difficulty: 'Hard',
        timeLimit: 8,
        questionsCount: 15,
        passingScore: 10,
        color: 'from-red-400 to-red-600',
        bgColor: 'from-red-50 to-red-100'
      }
    ]
  },
  'letter-sequencing-learning': {
    id: 'letter-sequencing-learning',
    title: 'Letter Sequencing',
    description: 'Arrange letters in the correct order to form words',
    icon: 'Shuffle',
    category: 'cognitive',
    estimatedDuration: '15-20 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: '3-letter words, simple patterns',
        difficulty: 'Beginner',
        timeLimit: 20,
        questionsCount: 8,
        passingScore: 6,
        color: 'from-green-400 to-teal-500',
        bgColor: 'from-green-50 to-teal-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: '4-letter words, basic patterns',
        difficulty: 'Easy',
        timeLimit: 18,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-teal-400 to-cyan-500',
        bgColor: 'from-teal-50 to-cyan-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: '5-6 letter words, complex patterns',
        difficulty: 'Moderate',
        timeLimit: 15,
        questionsCount: 12,
        passingScore: 8,
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'from-blue-50 to-indigo-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: '7+ letter words, challenging patterns',
        difficulty: 'Hard',
        timeLimit: 12,
        questionsCount: 15,
        passingScore: 10,
        color: 'from-purple-400 to-pink-500',
        bgColor: 'from-purple-50 to-pink-100'
      }
    ]
  },
  'reading-comprehension-learning': {
    id: 'reading-comprehension-learning',
    title: 'Reading Comprehension',
    description: 'Read passages and answer questions to test understanding',
    icon: 'Brain',
    category: 'reading',
    estimatedDuration: '20-25 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Short sentences, basic questions',
        difficulty: 'Beginner',
        timeLimit: 60,
        questionsCount: 5,
        passingScore: 3,
        color: 'from-purple-400 to-purple-600',
        bgColor: 'from-purple-50 to-purple-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: 'Simple paragraphs, straightforward questions',
        difficulty: 'Easy',
        timeLimit: 90,
        questionsCount: 6,
        passingScore: 4,
        color: 'from-indigo-400 to-purple-500',
        bgColor: 'from-indigo-50 to-purple-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Medium passages, inference questions',
        difficulty: 'Moderate',
        timeLimit: 120,
        questionsCount: 8,
        passingScore: 5,
        color: 'from-pink-400 to-rose-500',
        bgColor: 'from-pink-50 to-rose-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: 'Complex texts, analytical questions',
        difficulty: 'Hard',
        timeLimit: 150,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-rose-400 to-red-500',
        bgColor: 'from-rose-50 to-red-100'
      }
    ]
  },
  'letter-mirror-learning': {
    id: 'letter-mirror-learning',
    title: 'Letter Mirror',
    description: 'Identify visually similar letters to test visual discrimination',
    icon: 'Eye',
    category: 'visual',
    estimatedDuration: '8-12 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Basic letter pairs (b/d, p/q)',
        difficulty: 'Beginner',
        timeLimit: 8,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-orange-400 to-orange-600',
        bgColor: 'from-orange-50 to-orange-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: 'Common confusable letters',
        difficulty: 'Easy',
        timeLimit: 6,
        questionsCount: 12,
        passingScore: 8,
        color: 'from-amber-400 to-orange-500',
        bgColor: 'from-amber-50 to-orange-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Mixed case and rotated letters',
        difficulty: 'Moderate',
        timeLimit: 5,
        questionsCount: 15,
        passingScore: 10,
        color: 'from-red-400 to-pink-500',
        bgColor: 'from-red-50 to-pink-100'
      }
    ]
  },
  'speed-words-learning': {
    id: 'speed-words-learning',
    title: 'Speed Words',
    description: 'Rapid naming test to measure processing speed',
    icon: 'Zap',
    category: 'cognitive',
    estimatedDuration: '5-8 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Simple words, generous time',
        difficulty: 'Beginner',
        timeLimit: 5,
        questionsCount: 15,
        passingScore: 10,
        color: 'from-yellow-400 to-yellow-600',
        bgColor: 'from-yellow-50 to-yellow-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: 'Common words, moderate speed',
        difficulty: 'Easy',
        timeLimit: 4,
        questionsCount: 20,
        passingScore: 14,
        color: 'from-lime-400 to-green-500',
        bgColor: 'from-lime-50 to-green-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Mixed vocabulary, faster pace',
        difficulty: 'Moderate',
        timeLimit: 3,
        questionsCount: 25,
        passingScore: 18,
        color: 'from-orange-400 to-red-500',
        bgColor: 'from-orange-50 to-red-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: 'Complex words, rapid fire',
        difficulty: 'Hard',
        timeLimit: 2,
        questionsCount: 30,
        passingScore: 22,
        color: 'from-red-500 to-red-700',
        bgColor: 'from-red-100 to-red-200'
      }
    ]
  },
  'sound-twins-learning': {
    id: 'sound-twins-learning',
    title: 'Sound Twins',
    description: 'Distinguish between similar sounds for auditory discrimination',
    icon: 'Volume2',
    category: 'auditory',
    estimatedDuration: '10-15 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Clear sound differences',
        difficulty: 'Beginner',
        timeLimit: 10,
        questionsCount: 8,
        passingScore: 6,
        color: 'from-indigo-400 to-indigo-600',
        bgColor: 'from-indigo-50 to-indigo-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: 'Similar consonant sounds',
        difficulty: 'Easy',
        timeLimit: 8,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-blue-400 to-indigo-500',
        bgColor: 'from-blue-50 to-indigo-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Vowel discrimination',
        difficulty: 'Moderate',
        timeLimit: 6,
        questionsCount: 12,
        passingScore: 8,
        color: 'from-cyan-400 to-blue-500',
        bgColor: 'from-cyan-50 to-blue-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: 'Minimal sound pairs',
        difficulty: 'Hard',
        timeLimit: 5,
        questionsCount: 15,
        passingScore: 11,
        color: 'from-teal-400 to-cyan-500',
        bgColor: 'from-teal-50 to-cyan-100'
      }
    ]
  },

  'odd-one-out-learning': {
    id: 'odd-one-out-learning',
    title: 'Odd One Out',
    description: 'Find the word that doesn\'t belong to test pattern recognition',
    icon: 'Search',
    category: 'cognitive',
    estimatedDuration: '8-12 minutes',
    levels: [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Obvious category differences',
        difficulty: 'Beginner',
        timeLimit: 15,
        questionsCount: 8,
        passingScore: 6,
        color: 'from-teal-400 to-teal-600',
        bgColor: 'from-teal-50 to-teal-100'
      },
      {
        id: 'easy',
        name: 'Easy',
        description: 'Clear semantic categories',
        difficulty: 'Easy',
        timeLimit: 12,
        questionsCount: 10,
        passingScore: 7,
        color: 'from-emerald-400 to-teal-500',
        bgColor: 'from-emerald-50 to-teal-100'
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Subtle pattern recognition',
        difficulty: 'Moderate',
        timeLimit: 10,
        questionsCount: 12,
        passingScore: 8,
        color: 'from-green-400 to-emerald-500',
        bgColor: 'from-green-50 to-emerald-100'
      },
      {
        id: 'hard',
        name: 'Hard',
        description: 'Abstract relationships',
        difficulty: 'Hard',
        timeLimit: 8,
        questionsCount: 15,
        passingScore: 11,
        color: 'from-lime-400 to-green-500',
        bgColor: 'from-lime-50 to-green-100'
      }
    ]
  }
}

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'Beginner': return 'text-green-600'
    case 'Easy': return 'text-blue-600'
    case 'Moderate': return 'text-yellow-600'
    case 'Hard': return 'text-red-600'
    case 'Expert': return 'text-purple-600'
    default: return 'text-gray-600'
  }
}

export const getDifficultyBadgeColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800'
    case 'Easy': return 'bg-blue-100 text-blue-800'
    case 'Moderate': return 'bg-yellow-100 text-yellow-800'
    case 'Hard': return 'bg-red-100 text-red-800'
    case 'Expert': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}