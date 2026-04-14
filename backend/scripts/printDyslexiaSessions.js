/**
 * Print dyslexia_sessions for a user: accuracy, risk, risk_score, ml_prediction.
 * Usage: node backend/scripts/printDyslexiaSessions.js <userId>
 * Run from repo root: node backend/scripts/printDyslexiaSessions.js <uuid>
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const userId = process.argv[2];
if (!userId || !String(userId).trim()) {
  console.error("Usage: node backend/scripts/printDyslexiaSessions.js <userId>");
  process.exit(1);
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "yourpassword",
  database: process.env.POSTGRES_DB || "dyslexia_db",
});

(async () => {
  try {
    const { rows } = await pool.query(
      `
      SELECT session_id, game_type, difficulty, score, total, accuracy,
             risk, risk_score, ml_prediction, reading_speed_wpm, "timestamp"
      FROM dyslexia_sessions
      WHERE user_id = $1
      ORDER BY "timestamp" DESC
      LIMIT 25
      `,
      [String(userId).trim()]
    );
    if (!rows.length) {
      console.log("No sessions for user_id:", userId);
      process.exit(0);
    }
    console.log(`Sessions for user_id=${userId} (newest first, max 25)\n`);
    for (const r of rows) {
      const accPct = Math.round(Number(r.accuracy) > 1 ? Number(r.accuracy) : Number(r.accuracy) * 100);
      const pred =
        r.ml_prediction === 1 ? "elevated (1)" : r.ml_prediction === 0 ? "typical (0)" : String(r.ml_prediction);
      console.log(
        [
          r.timestamp?.toISOString?.() || r.timestamp,
          r.game_type,
          `${r.score}/${r.total}`,
          `accuracy=${accPct}%`,
          `risk=${r.risk ?? "?"}`,
          `risk_score=${r.risk_score != null ? Number(r.risk_score).toFixed(3) : "?"}`,
          `prediction=${pred}`,
        ].join(" | ")
      );
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
