import { useState } from 'react';
import { CameraTracker } from './tracking/CameraTracker';
import { useSessionTracker } from '../hooks/useSessionTracker';

const GameWithTracking = () => {
  const [score, setScore] = useState(0);
  const userId = 'user123'; // Replace with actual user ID from auth context
  
  const {
    startTracking,
    recordWordRead,
    updateAccuracy,
    calculateMetrics,
  } = useSessionTracker({ userId, gameScore: score });

  const handleGameStart = () => {
    startTracking();
  };

  const handleWordRead = () => {
    recordWordRead();
    calculateMetrics();
  };

  const handleCorrectAnswer = () => {
    setScore(prev => prev + 10);
    updateAccuracy(score + 10, score + 10);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 sm:p-6 w-full max-w-7xl mx-auto">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold mb-4">Game Area</h2>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <button onClick={handleGameStart} className="bg-green-600 text-white px-4 py-3 rounded min-h-[2.75rem]">
            Start Game
          </button>
          <button onClick={handleWordRead} className="bg-blue-600 text-white px-4 py-3 rounded min-h-[2.75rem]">
            Read Word
          </button>
          <button onClick={handleCorrectAnswer} className="bg-purple-600 text-white px-4 py-3 rounded min-h-[2.75rem]">
            Correct Answer
          </button>
        </div>
        <p className="mt-4 text-xl">Score: {score}</p>
      </div>
      
      <div className="w-full lg:w-[24rem] max-w-full">
        <CameraTracker 
          userId={userId} 
          gameScore={score}
          gameName="word-recognition-learning"
          difficulty="medium"
          totalQuestions={10}
          isGamePage={true}
          errors={[]}
          onMetricsUpdate={(m) => console.log('Metrics updated:', m)}
          onSessionSaved={(res) => console.log('Dyslexia session saved:', res)}
        />
      </div>
    </div>
  );
};

export default GameWithTracking;
