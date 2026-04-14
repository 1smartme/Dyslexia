// backend/controllers/scoreController.js
const pool = require("../lib/postgres");

// Save a game score
exports.saveScore = async (req, res) => {
  try {
    const { game_name, score } = req.body;
    const user_id = req.user.id;

    if (!game_name || score == null) {
      return res.status(400).json({ error: "game_name and score are required" });
    }

    const result = await pool.query(
      `INSERT INTO game_results (user_id, game_type, game_name, difficulty, score, has_dyslexia, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [user_id, game_name, game_name, "medium", Number(score), false]
    );

    res.json({ message: "Score saved successfully", data: result.rows[0] });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
};

// Get recent scores for logged-in user
exports.getScores = async (req, res) => {
  try {
    const user_id = req.user.id;

    const rows = await pool.query(
      `SELECT id, user_id, game_name, score, completed_at
       FROM game_results
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [user_id]
    );

    res.json(rows.rows);
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
};

// Optional: Get scores for a user by date range
exports.getScoresByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user_id = req.user.id;

    const rows = await pool.query(
      `SELECT id, user_id, game_name, score, completed_at
       FROM game_results
       WHERE user_id = $1 AND completed_at BETWEEN $2::timestamptz AND $3::timestamptz
       ORDER BY completed_at DESC`,
      [user_id, startDate, endDate]
    );

    res.json(rows.rows);
  } catch (err) {
    console.error("Error fetching scores by date range:", err);
    res.status(500).json({ error: "Failed to fetch scores by date range" });
  }
};
