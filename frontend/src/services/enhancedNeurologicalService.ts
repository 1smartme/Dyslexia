const API_BASE = 'http://localhost:5000/api'

export interface EnhancedNeurologicalTag {
  tag: string
  confidence: number
  source: 'rule_based' | 'ml_model' | 'rule_based_fallback'
  question?: string
  expected?: string
  actual?: string
  mlEnhanced?: boolean
  probabilities?: Record<string, number>
}

export interface MLAnalysis {
  available: boolean
  confidence: number
  enhancedTags: number
}

export interface EnhancedGameAnalysis {
  difficulty: number
  performanceLabel: string
  dyslexiaIndicators: string[]
  neurologicalTags: EnhancedNeurologicalTag[]
  mlEnhancedTags?: EnhancedNeurologicalTag[]
  riskLevel: 'low' | 'moderate' | 'high'
  needsAssessment: boolean
  patterns: {
    responseTime: 'slow' | 'normal'
    accuracy: 'low' | 'medium' | 'high'
    errorFrequency: number
  }
  mlAnalysis?: MLAnalysis
}

export const analyzeEnhancedGamePerformance = async (gameData: {
  userId: string
  game: string
  score: number
  timeTaken: number
  mistakes: Record<string, any>
}): Promise<EnhancedGameAnalysis> => {
  try {
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
      throw new Error(`Failed to analyze game performance: ${response.status}`)
    }

    const result = await response.json()
    return result.analysis
  } catch (error) {
    console.error('Error analyzing game performance:', error)
    
    // Fallback to client-side analysis
    return fallbackAnalysis(gameData)
  }
}

// Client-side fallback analysis when backend is unavailable
const fallbackAnalysis = (gameData: {
  userId: string
  game: string
  score: number
  timeTaken: number
  mistakes: Record<string, any>
}): EnhancedGameAnalysis => {
  const { score, timeTaken, mistakes } = gameData
  
  // Basic analysis
  let difficulty = 2
  if (score < 40) difficulty = 1
  else if (score > 80) difficulty = 4
  else if (score > 60) difficulty = 3

  let riskLevel: 'low' | 'moderate' | 'high' = 'low'
  const errorCount = Object.keys(mistakes || {}).length
  
  if (score < 40 || errorCount > 5) riskLevel = 'high'
  else if (score < 60 || errorCount > 3) riskLevel = 'moderate'

  const dyslexiaIndicators: string[] = []
  const neurologicalTags: EnhancedNeurologicalTag[] = []

  // Basic pattern detection
  if (timeTaken > 4000) {
    dyslexiaIndicators.push('slow_processing')
    neurologicalTags.push({
      tag: 'slow_processing',
      confidence: 0.7,
      source: 'rule_based_fallback'
    })
  }

  if (errorCount > 3) {
    dyslexiaIndicators.push('error_patterns')
    neurologicalTags.push({
      tag: 'error_patterns',
      confidence: 0.6,
      source: 'rule_based_fallback'
    })
  }

  return {
    difficulty,
    performanceLabel: score > 80 ? 'excellent' : score > 60 ? 'good' : score > 40 ? 'average' : 'weak',
    dyslexiaIndicators,
    neurologicalTags,
    riskLevel,
    needsAssessment: riskLevel !== 'low',
    patterns: {
      responseTime: timeTaken > 3500 ? 'slow' : 'normal',
      accuracy: score > 70 ? 'high' : score > 50 ? 'medium' : 'low',
      errorFrequency: errorCount
    },
    mlAnalysis: {
      available: false,
      confidence: 0,
      enhancedTags: 0
    }
  }
}

export const getEnhancedInsights = (analysis: EnhancedGameAnalysis): {
  primaryConcerns: string[]
  recommendations: string[]
  confidence: number
  mlEnhanced: boolean
} => {
  const allTags = [
    ...(analysis.neurologicalTags || []),
    ...(analysis.mlEnhancedTags || [])
  ]

  const tagCounts: Record<string, { count: number, totalConfidence: number, hasMl: boolean }> = {}
  
  allTags.forEach(tag => {
    if (!tagCounts[tag.tag]) {
      tagCounts[tag.tag] = { count: 0, totalConfidence: 0, hasMl: false }
    }
    tagCounts[tag.tag].count++
    tagCounts[tag.tag].totalConfidence += tag.confidence
    if (tag.source === 'ml_model') {
      tagCounts[tag.tag].hasMl = true
    }
  })

  const primaryConcerns = Object.entries(tagCounts)
    .filter(([_, data]) => data.totalConfidence / data.count > 0.6)
    .sort((a, b) => {
      // Prioritize ML-enhanced tags
      if (a[1].hasMl && !b[1].hasMl) return -1
      if (!a[1].hasMl && b[1].hasMl) return 1
      return (b[1].totalConfidence / b[1].count) - (a[1].totalConfidence / a[1].count)
    })
    .slice(0, 3)
    .map(([tag]) => tag)

  const recommendations = generateEnhancedRecommendations(primaryConcerns, analysis)
  const confidence = allTags.length > 0 ? 
    allTags.reduce((sum, tag) => sum + tag.confidence, 0) / allTags.length : 0

  return { 
    primaryConcerns, 
    recommendations, 
    confidence,
    mlEnhanced: analysis.mlAnalysis?.available || false
  }
}

const generateEnhancedRecommendations = (concerns: string[], analysis: EnhancedGameAnalysis): string[] => {
  const recommendationMap: Record<string, string[]> = {
    letter_reversal: [
      'Practice with letter tracing exercises using multisensory approaches',
      'Use mnemonic devices to remember letter orientations (b has a belly, d has a back)',
      'Focus on letter formation with guided practice'
    ],
    phonological_processing: [
      'Work on sound-symbol relationships with phonics programs',
      'Practice rhyming and sound blending activities',
      'Use auditory discrimination exercises'
    ],
    visual_processing: [
      'Strengthen visual discrimination with matching exercises',
      'Practice with high-contrast materials and clear fonts',
      'Use visual tracking and scanning activities'
    ],
    sequencing: [
      'Practice with sequence-based games and pattern activities',
      'Work on step-by-step instruction following',
      'Use visual organizers for multi-step tasks'
    ],
    working_memory: [
      'Break complex tasks into smaller, manageable chunks',
      'Use memory aids and visual supports consistently',
      'Practice memory strengthening exercises gradually'
    ],
    processing_speed: [
      'Allow extra time for task completion',
      'Reduce time pressure in learning activities',
      'Focus on accuracy over speed initially'
    ],
    slow_processing: [
      'Provide additional processing time',
      'Use clear, step-by-step instructions',
      'Allow for repeated practice opportunities'
    ],
    error_patterns: [
      'Analyze specific error types for targeted intervention',
      'Provide immediate feedback and correction',
      'Use error analysis to guide instruction'
    ]
  }

  const recommendations: string[] = []
  concerns.forEach(concern => {
    if (recommendationMap[concern]) {
      recommendations.push(...recommendationMap[concern])
    }
  })

  // Add ML-specific recommendations if available
  if (analysis.mlAnalysis?.available && analysis.mlAnalysis.confidence > 0.7) {
    recommendations.unshift('ML analysis indicates high confidence in pattern detection - consider specialized assessment')
  }

  // Add risk-level specific recommendations
  if (analysis.riskLevel === 'high') {
    recommendations.unshift('Consider consultation with a learning specialist or educational psychologist')
  } else if (analysis.riskLevel === 'moderate') {
    recommendations.unshift('Monitor progress closely and consider additional support if needed')
  }

  return [...new Set(recommendations)].slice(0, 6)
}

export const formatEnhancedIndicator = (indicator: string): string => {
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
    slow_processing: 'Slow Processing',
    sequencing: 'Sequencing Issues',
    other: 'Other Patterns'
  }

  return formatMap[indicator] || indicator.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Backward compatibility exports
export { analyzeEnhancedGamePerformance as analyzeGamePerformance }
export type { EnhancedGameAnalysis as GameAnalysis }
export type { EnhancedNeurologicalTag as NeurologicalTag }