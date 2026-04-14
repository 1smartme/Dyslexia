import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Clock,
  Target,
  Brain,
  RefreshCw,
} from "lucide-react";
import { getRecentScores } from '../services/scoreService'
import { scoreRowToPercent } from '../lib/profileAggregates'

import { getRecommendations } from "../services/recommendationService";
import {
  getAssessment,
  type NeurologicalAssessment,
} from "../services/assessmentService";
import { useAuth } from "../contexts/AuthContext";

export default function StudentDashboard() {
  const { user: authUser } = useAuth();

  // If user is null, show a loader
  if (!authUser)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading user...
      </div>
    );

  // After this point, user is guaranteed non-null
  const user = authUser;

  const [scores, setScores] = useState<any[]>([]);
  const [, setRecs] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<NeurologicalAssessment | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, r, a] = await Promise.all([
          getRecentScores(30, String(user.id)),
          getRecommendations(10, String(user.id)),
          getAssessment(String(user.id)),
        ]);
        setScores(s ?? []);
        setRecs(r ?? []);
        setAssessment(a ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();

    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user.id]); // only depend on user.id

  // Stats calculations
  const gamesPlayed = scores.length;
  const percents = scores.map((s) => scoreRowToPercent(s));
  const avgAccuracy =
    percents.length > 0
      ? percents.reduce((sum, p) => sum + p, 0) / percents.length
      : 0;
  const bestScore = percents.length > 0 ? Math.max(...percents) : 0;
  const totalTimePlayed = scores.reduce(
    (sum, s) => sum + (s.time_taken || 0),
    0
  );
  const totalTimeMinutes = Math.round(totalTimePlayed / 60000);

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.email.split("@")[0]}! 👋
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost btn-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Track your learning progress and see how you're improving
          </p>
        </motion.div>

        {/* Loader */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {/* Games Played */}
              <motion.div
                className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Games Played</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {gamesPlayed}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Average Score */}
              <motion.div
                className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(avgAccuracy)}%
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Best Score */}
              <motion.div
                className="card p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Best Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(bestScore)}%
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Time Played */}
              <motion.div
                className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Time Played</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalTimeMinutes}m
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Neurological Assessment */}
            {assessment && (
              <motion.div
                className="card p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-500" />
                  Neurological Assessment
                </h2>
                {/* assessment UI goes here */}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
