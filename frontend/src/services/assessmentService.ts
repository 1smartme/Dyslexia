const API_BASE = 'http://localhost:5000/api'

export interface NeurologicalAssessment {
  assessment: {
    overallRisk: 'low_risk' | 'moderate_risk' | 'high_risk'
    needsProfessionalAssessment: boolean
    confidence: number
  }
  indicators: Array<{
    name: string
    frequency: number
  }>
  riskDistribution: {
    low: number
    moderate: number
    high: number
  }
  gamePerformance: Record<string, {
    scores: number[]
    avgScore: number
    trend: 'improving' | 'declining' | 'stable'
  }>
  recommendations: string[]
  totalAssessments: number
}

export const getAssessment = async (userId: string): Promise<NeurologicalAssessment | null> => {
  try {
    const response = await fetch(`${API_BASE}/assessment/${userId}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch assessment:', error)
    return null
  }
}