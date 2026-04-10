import { pool } from '../lib/mysql.js';

// Save a game score
export async function saveGameScore({
  userId,
  gameName,
  difficulty,
  accuracy,
  avgResponseTime,
  errors
}) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO game_scores 
        (user_id, game_name, difficulty_level, accuracy, avg_response_time, errors, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, gameName, difficulty, accuracy, avgResponseTime, JSON.stringify(errors)]
    );
    return { data: result, error: null };
  } catch (error) {
    console.error('Error saving game score:', error);
    return { data: null, error };
  }
}

// Get recent scores
export async function getRecentScores(limit = 30, userId) {
  try {
    let query = 'SELECT * FROM game_scores';
    const params = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching recent scores:', error);
    return [];
  }
}

// Optional: scores by date range
export async function getScoresByDateRange(userId, startDate, endDate) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM game_scores 
       WHERE user_id = ? AND created_at BETWEEN ? AND ? 
       ORDER BY created_at DESC`,
      [userId, startDate, endDate]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching scores by date range:', error);
    return [];
  }
}
