const pool = require("../lib/postgres");

exports.saveProgress = async (req, res) => {
  const { level, status, game_name, score } = req.body;
  const userId = req.user.id;

  try {
    const resolvedGameName = game_name || `Level ${level || 1}`;
    const resolvedScore = Number(score ?? level ?? 0);
    const resolvedDifficulty = status || "progress";

    await pool.query(
      `INSERT INTO game_results (user_id, game_type, game_name, difficulty, score, has_dyslexia, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, "progress", resolvedGameName, resolvedDifficulty, resolvedScore, false]
    );

    return res.json({ message: "Progress saved" });
  } catch (err) {
    console.error("Error saving progress:", err);
    return res.status(500).json({ error: "Failed to save progress" });
  }
};

exports.getUserStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const scoreRowsRes = await pool.query(
      `SELECT id, game_name, score, completed_at
       FROM game_results
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [userId]
    );
    const scoreRows = scoreRowsRes.rows;

    const totalTimePlayed = 0;

    const toPercent = (row) => {
      const s = Number(row.score ?? 0);
      if (!Number.isFinite(s)) return 0;
      if (s >= 0 && s <= 10) return Math.min(100, Math.round(s * 10));
      if (s <= 100) return Math.round(s);
      return Math.min(100, Math.round(s));
    };

    const percents = scoreRows.map(toPercent);
    const totalGamesPlayed = scoreRows.length;
    const averageScore = totalGamesPlayed
      ? Math.round(percents.reduce((sum, p) => sum + p, 0) / totalGamesPlayed)
      : 0;
    const bestScore = totalGamesPlayed ? Math.max(...percents) : 0;

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
