import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Clock, TrendingUp } from "lucide-react";
import { getRecentScores } from '../services/scoreService'

import { useAuth } from "../contexts/AuthContext";

export default function TeacherDashboard() {
  const { user, isTeacher, isAdmin } = useAuth();
  const [allScores, setAllScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!isTeacher && !isAdmin) return;

  async function load() {
    setLoading(true);
    try {
      const scores = await getRecentScores(100);
      setAllScores(scores ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  load();

  // Optional: refresh every 10 seconds
  const interval = setInterval(load, 10000);
  return () => clearInterval(interval);
}, [isTeacher, isAdmin]);


  if (!isTeacher && !isAdmin) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">Teacher access required</p>
        </div>
      </div>
    );
  }

  const uniqueStudents = new Set(allScores.map(s => s.user_id)).size;
  const avgAccuracy = allScores.length > 0 ? allScores.reduce((sum, s) => sum + (s.accuracy || 0), 0) / allScores.length : 0;
  const recentActivity = allScores.filter(s => new Date(s.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard 👩‍🏫</h1>
          <p className="text-gray-600">Monitor student progress and activity in real-time</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div 
                className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900">{uniqueStudents}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Class Average</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(avgAccuracy)}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today's Activity</p>
                    <p className="text-2xl font-bold text-gray-900">{recentActivity}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Live Activity Feed */}
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Live Activity Feed
              </h2>
              
              {allScores.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No student activity yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allScores.slice(0, 20).map((score, index) => (
                    <motion.div
                      key={score.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          score.accuracy >= 80 ? 'bg-green-500' :
                          score.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            Student {score.user_id.slice(-6)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {score.game_name} • {score.difficulty_level} • {Math.round(score.accuracy)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(score.created_at).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}