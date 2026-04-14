const pool = require("../lib/postgres");

exports.findAdminByEmail = async (email) => {
  const rows = await pool.query("SELECT * FROM admin WHERE email = $1 LIMIT 1", [email]);
  return rows.rows[0] || null;
};

exports.getAllStudents = async () => {
  const rows = await pool.query(
    `SELECT id, username AS name, email, created_at
     FROM users
     WHERE is_admin = FALSE
     ORDER BY created_at DESC`
  );
  return rows.rows;
};

exports.deleteStudent = async (studentId) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1::uuid", [studentId]);
  return result.rowCount > 0;
};

exports.getAllParents = async () => {
  const rows = await pool.query(
    "SELECT id, name, email, created_at FROM parents ORDER BY created_at DESC"
  );
  return rows.rows;
};

exports.getPlatformAnalytics = async () => {
  const students = await pool.query(
    "SELECT COUNT(*)::int AS total_students FROM users WHERE is_admin = FALSE"
  );
  const parents = await pool.query("SELECT COUNT(*)::int AS total_parents FROM parents");
  const scores = await pool.query(
    "SELECT COALESCE(AVG(score), 0) AS avg_score, COUNT(*)::int AS total_games_played FROM game_results"
  );

  return {
    total_students: Number(students.rows[0]?.total_students || 0),
    total_parents: Number(parents.rows[0]?.total_parents || 0),
    avg_score: Number(scores.rows[0]?.avg_score || 0),
    total_games_played: Number(scores.rows[0]?.total_games_played || 0),
  };
};
