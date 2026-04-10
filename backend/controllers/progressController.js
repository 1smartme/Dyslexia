const db = require("../config/db");
const { pool } = require("../lib/mysql");

exports.saveProgress = (req, res) => {
  const { level, status } = req.body;

  db.query(
    "INSERT INTO progress (user_id, level, status) VALUES (?, ?, ?)",
    [req.user.id, level, status],
    (err, result) => {
      if (err) return res.status(400).json({ error: err });
      res.json({ message: "Progress saved" });
    }
  );
};

exports.getUserStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const [scoreRows] = await pool.execute(
      `SELECT id, game_name, score, created_at
       FROM scores
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    let totalTimePlayed = 0;
    try {
      const [timeRows] = await pool.execute(
        `SELECT COALESCE(SUM(time_taken), 0) AS total_time_played
         FROM scores
         WHERE user_id = ?`,
        [userId]
      );
      totalTimePlayed = Number(timeRows?.[0]?.total_time_played || 0);
    } catch (_err) {
      // Fallback when time_taken column is unavailable in current schema.
      totalTimePlayed = 0;
    }

    const totalGamesPlayed = scoreRows.length;
    const averageScore = totalGamesPlayed
      ? Math.round(
          scoreRows.reduce((sum, row) => sum + Number(row.score || 0), 0) / totalGamesPlayed
        )
      : 0;
    const bestScore = totalGamesPlayed
      ? Math.max(...scoreRows.map((row) => Number(row.score || 0)))
      : 0;

    return res.json({
      totalGamesPlayed,
      averageScore,
      bestScore,
      totalTimePlayed,
      recentGames: scoreRows.slice(0, 10),
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return res.status(500).json({ error: "Failed to fetch user stats" });
  }
};
