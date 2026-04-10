// backend/controllers/scoreController.js
const { pool } = require("../lib/mysql");

// Save a game score
exports.saveScore = async (req, res) => {
  try {
    const { game_name, score } = req.body;
    const user_id = req.user.id;

    if (!game_name || score == null) {
      return res.status(400).json({ error: "game_name and score are required" });
    }

    const [result] = await pool.execute(
      `INSERT INTO scores (user_id, game_name, score, created_at) VALUES (?, ?, ?, NOW())`,
      [user_id, game_name, score]
    );

    res.json({ message: "Score saved successfully", data: result });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
};

// Get recent scores for logged-in user
exports.getScores = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await pool.execute(
      `SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(rows);
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

    const [rows] = await pool.execute(
      `SELECT * FROM scores 
       WHERE user_id = ? AND created_at BETWEEN ? AND ?
       ORDER BY created_at DESC`,
      [user_id, startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching scores by date range:", err);
    res.status(500).json({ error: "Failed to fetch scores by date range" });
  }
};
