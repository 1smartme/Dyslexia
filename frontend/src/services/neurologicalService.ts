const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
const DYSLEXIA_ANALYZE_URL = `${API_BASE}/dyslexia/analyze`

export interface NeurologicalTag {
  tag: string
  confidence: number
  source: string
  question?: string
  expected?: string
  actual?: string
}

export interface NeurologicalAnalysis {
  indicators: string[]
  tags: NeurologicalTag[]
  riskLevel: 'low' | 'moderate' | 'high'
  patterns: {
    responseTime: 'slow' | 'normal'
    accuracy: 'low' | 'medium' | 'high'
    errorFrequency: number
  }
  needsAssessment: boolean
}

export interface GameAnalysis {
  difficulty: number
  performanceLabel: string
  dyslexiaIndicators: string[]
  neurologicalTags: NeurologicalTag[]
  mlEnhancedTags?: NeurologicalTag[]
  riskLevel: string
  needsAssessment: boolean
  patterns: {
    responseTime: 'slow' | 'normal'
    accuracy: 'low' | 'medium' | 'high'
    errorFrequency: number
  }
  mlAnalysis?: {
    available: boolean
    confidence: number
    enhancedTags: number
  }
}

interface DyslexiaSaveDataPayload {
  session_id: string
  name: string
  age: number
  grade: number
  score: number
  total: number
  errors: Array<{ expected: string; actual: string }>
  fixation_stats: { mean_duration: number }
  regressions: { count: number }
  reading_speed_wpm: number
  scanpath_entropy: number
  gaze_stream: any[]
}

const buildDyslexiaPayload = (gameData: {
  userId: string
  game: string
  score: number
  timeTaken: number
  mistakes: Record<string, any>
}): DyslexiaSaveDataPayload => {
  const scoreValue = Number.isFinite(gameData.score) ? Number(gameData.score) : 0
  const total = 100

  const errors = Object.entries(gameData.mistakes || {}).map(([expected, actual]) => ({
    expected,
    actual: typeof actual === 'string' ? actual : JSON.stringify(actual)
  }))

  return {
    session_id: `${gameData.userId}-${gameData.game}-${Date.now()}`,
    name: gameData.userId || 'Unknown',
    age: 0,
    grade: 0,
    score: Math.max(0, Math.min(total, Math.round(scoreValue))),
    total,
    errors,
    fixation_stats: { mean_duration: gameData.timeTaken || 0 },
    regressions: { count: 0 },
    reading_speed_wpm: 0,
    scanpath_entropy: 0,
    gaze_stream: []
  }
}

export const sendDyslexiaAssessmentData = async (gameData: {
  userId: string
  game: string
  score: number
  timeTaken: number
  mistakes: Record<string, any>
}) => {
  const payload = buildDyslexiaPayload(gameData)
  const response = await fetch(DYSLEXIA_ANALYZE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Dyslexia analysis failed: ${response.status} ${details}`)
  }

  return response.json()
}

export const analyzeGamePerformance = async (gameData: {
  userId: string
  game: string
  score: number
  timeTaken: number
  mistakes: Record<string, any>
}): Promise<GameAnalysis> => {
  try {
    // Keep existing behavior while forwarding compatible payload to ML pipeline.
    sendDyslexiaAssessmentData(gameData).catch(error => {
      console.warn('Dyslexia forwarding failed:', error)
    })

    const response = await fetch(`${API_BASE}/scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: gameData.userId,
        game: gameData.game,
        score: gameData.score,
        time_taken: gameData.timeTaken,
        mistakes: gameData.mistakes
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze game performance')
    }

    const result = await response.json()
    return result.analysis
  } catch (error) {
    console.error('Error analyzing game performance:', error)
    throw error
  }
}

export const logMistakeWithTags = async (mistakeData: {
  attemptId: string
  questionNo: number
  expectedAnswer: string
  userAnswer: string
  rawData?: any
}) => {
  try {
    const response = await fetch(`${API_BASE}/mistakes/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: mistakeData.attemptId,
        question_no: mistakeData.questionNo,
        expected_answer: mistakeData.expectedAnswer,
        user_answer: mistakeData.userAnswer,
        raw_data: mistakeData.rawData
      })
    })

    if (!response.ok) {
      throw new Error('Failed to log mistake')
    }

    return await response.json()
  } catch (error) {
    console.error('Error logging mistake:', error)
    throw error
  }
}

export const getNeurologicalInsights = (tags: NeurologicalTag[]): {
  primaryConcerns: string[]
  recommendations: string[]
  confidence: number
} => {
  const tagCounts: Record<string, { count: number, totalConfidence: number }> = {}
  
  tags.forEach(tag => {
    if (!tagCounts[tag.tag]) {
      tagCounts[tag.tag] = { count: 0, totalConfidence: 0 }
    }
    tagCounts[tag.tag].count++
    tagCounts[tag.tag].totalConfidence += tag.confidence
  })

  const primaryConcerns = Object.entries(tagCounts)
    .filter(([_, data]) => data.totalConfidence / data.count > 0.6)
    .sort((a, b) => (b[1].totalConfidence / b[1].count) - (a[1].totalConfidence / a[1].count))
    .slice(0, 3)
    .map(([tag]) => tag)

  const recommendations = generateRecommendations(primaryConcerns)
  const confidence = tags.length > 0 ? 
    tags.reduce((sum, tag) => sum + tag.confidence, 0) / tags.length : 0

  return { primaryConcerns, recommendations, confidence }
}

const generateRecommendations = (concerns: string[]): string[] => {
  const recommendationMap: Record<string, string[]> = {
    letter_reversal: [
      'Practice with letter tracing exercises',
      'Use multisensory learning approaches',
      'Focus on letter orientation activities'
    ],
    phonological_awareness: [
      'Work on sound-symbol relationships',
      'Practice rhyming and sound blending',
      'Use phonics-based reading programs'
    ],
    visual_processing: [
      'Strengthen visual discrimination skills',
      'Practice with visual tracking exercises',
      'Use high-contrast materials'
    ],
    sequencing: [
      'Practice with sequence-based activities',
      'Work on pattern recognition',
      'Use step-by-step instruction methods'
    ],
    working_memory: [
      'Break tasks into smaller chunks',
      'Use memory aids and visual supports',
      'Practice memory strengthening exercises'
    ],
    processing_speed: [
      'Allow extra time for tasks',
      'Reduce time pressure',
      'Focus on accuracy over speed'
    ]
  }

  const recommendations: string[] = []
  concerns.forEach(concern => {
    if (recommendationMap[concern]) {
      recommendations.push(...recommendationMap[concern])
    }
  })

  return [...new Set(recommendations)].slice(0, 5)
}

export const formatNeurologicalIndicator = (indicator: string): string => {
  const formatMap: Record<string, string> = {
    phonological_processing: 'Phonological Processing',
    visual_processing: 'Visual Processing',
    working_memory: 'Working Memory',
    sequencing_difficulty: 'Sequencing Difficulty',
    rapid_naming: 'Rapid Naming',
    processing_speed: 'Processing Speed',
    letter_reversal: 'Letter Reversal',
    auditory_discrimination: 'Auditory Discrimination',
    phonemic_awareness: 'Phonemic Awareness',
    word_retrieval: 'Word Retrieval',
    pattern_recognition: 'Pattern Recognition',
    error_patterns: 'Error Patterns',
    slow_processing: 'Slow Processing'
  }

  return formatMap[indicator] || indicator.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}