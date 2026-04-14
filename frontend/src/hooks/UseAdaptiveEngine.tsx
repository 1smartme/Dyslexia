// src/hooks/useAdaptiveEngine.tsx
import { useState } from "react";
import { getNextDifficulty } from "../utils/adaptiveEngine";
import { saveGameScore } from "../services/gamesService";
import { saveRecommendation } from "../services/recommendationService";
import { analyzeGamePerformance } from "../services/neurologicalService";

export function useAdaptiveEngine(initialDifficulty = 1) {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [loading, setLoading] = useState(false);
  const [neurologicalAnalysis, setNeurologicalAnalysis] = useState<any>(null);

  async function onLevelEnd(payload: {
    gameName: string;
    accuracy: number;
    avgResponseTime: number;
    errors?: Record<string, any>;
    userId?: string;
  }) {
    setLoading(true);
    try {
      // Enhanced neurological analysis
      if (payload.userId) {
        const analysis = await analyzeGamePerformance({
          userId: String(payload.userId),
          game: payload.gameName,
          score: payload.accuracy,
          timeTaken: payload.avgResponseTime,
          mistakes: payload.errors || {}
        });
        setNeurologicalAnalysis(analysis);
      }

      // Save score with traditional method for compatibility
      await saveGameScore({
        userId: payload.userId || 'anonymous',
        gameName: payload.gameName,
        difficulty: String(difficulty),
        accuracy: payload.accuracy,
        avgResponseTime: payload.avgResponseTime,
        errors: payload.errors
      });

      // Decide next difficulty
      const result = getNextDifficulty({
        accuracy: payload.accuracy,
        avgResponseTime: payload.avgResponseTime,
        errors: payload.errors
      });

      // Save recommendation
      await saveRecommendation({
        gameName: payload.gameName,
        recommendedDifficulty: String(result.next),
        reason: result.reason
      });

      // Update difficulty locally
      setDifficulty(result.next);

      return {
        ...result,
        neurologicalAnalysis: {
          ...neurologicalAnalysis,
          mlAnalysis: neurologicalAnalysis?.mlAnalysis
        }
      };
    } finally {
      setLoading(false);
    }
  }

  return { 
    difficulty, 
    setDifficulty, 
    onLevelEnd, 
    loading, 
    neurologicalAnalysis 
  };
}
