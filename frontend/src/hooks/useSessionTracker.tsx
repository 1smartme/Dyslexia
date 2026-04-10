import { useState, useCallback, useEffect } from 'react';
import type { SessionMetrics } from '../components/tracking/CameraTracker';

interface UseSessionTrackerProps {
  userId: string;
  gameScore?: number;
}

export const useSessionTracker = ({ userId, gameScore = 0 }: UseSessionTrackerProps) => {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    timestamp: '',
    readingSpeedWPM: 0,
    fixationCount: 0,
    accuracy: 0,
    regressionCount: 0,
    fixationMeanDuration: 0,
    scoreTotal: gameScore
  });

  const [wordCount, setWordCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [fixations, setFixations] = useState<number[]>([]);

  useEffect(() => {
    setMetrics(prev => ({ ...prev, scoreTotal: gameScore }));
  }, [gameScore]);

  const startTracking = useCallback(() => {
    setStartTime(Date.now());
    setMetrics(prev => ({ ...prev, timestamp: new Date().toISOString() }));
  }, []);

  const recordWordRead = useCallback(() => {
    setWordCount(prev => prev + 1);
  }, []);

  const recordFixation = useCallback((duration: number) => {
    setFixations(prev => [...prev, duration]);
    setMetrics(prev => ({ ...prev, fixationCount: prev.fixationCount + 1 }));
  }, []);

  const recordRegression = useCallback(() => {
    setMetrics(prev => ({ ...prev, regressionCount: prev.regressionCount + 1 }));
  }, []);

  const updateAccuracy = useCallback((correct: number, total: number) => {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    setMetrics(prev => ({ ...prev, accuracy }));
  }, []);

  const calculateMetrics = useCallback(() => {
    if (startTime && wordCount > 0) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const wpm = Math.round(wordCount / elapsedMinutes);
      setMetrics(prev => ({ ...prev, readingSpeedWPM: wpm }));
    }

    if (fixations.length > 0) {
      const meanDuration = Math.round(fixations.reduce((a, b) => a + b, 0) / fixations.length);
      setMetrics(prev => ({ ...prev, fixationMeanDuration: meanDuration }));
    }
  }, [startTime, wordCount, fixations]);

  const resetMetrics = useCallback(() => {
    setMetrics({
      timestamp: '',
      readingSpeedWPM: 0,
      fixationCount: 0,
      accuracy: 0,
      regressionCount: 0,
      fixationMeanDuration: 0,
      scoreTotal: gameScore
    });
    setWordCount(0);
    setStartTime(null);
    setFixations([]);
  }, [gameScore]);

  return {
    metrics,
    startTracking,
    recordWordRead,
    recordFixation,
    recordRegression,
    updateAccuracy,
    calculateMetrics,
    resetMetrics
  };
};
