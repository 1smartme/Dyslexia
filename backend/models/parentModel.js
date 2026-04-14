const pool = require("../lib/postgres");

exports.createParent = async ({ name, email, password }) => {
  const result = await pool.query(
    "INSERT INTO parents (name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email",
    [name, email, password]
  );
  return result.rows[0];
};

exports.findParentByEmail = async (email) => {
  const rows = await pool.query("SELECT * FROM parents WHERE email = $1 LIMIT 1", [email]);
  return rows.rows[0] || null;
};

exports.getParentStudents = async (parentId) => {
  const rows = await pool.query(
    `SELECT u.id, u.username AS name, u.email
     FROM parent_student_map psm
     INNER JOIN users u ON u.id = psm.student_id
     WHERE psm.parent_id = $1
     ORDER BY u.username ASC`,
    [parentId]
  );
  return rows.rows;
};

exports.getStudentResultsForParent = async (parentId, studentId) => {
  const studentRows = await pool.query(
    `SELECT u.id, u.username AS name, u.email
     FROM parent_student_map psm
     INNER JOIN users u ON u.id = psm.student_id
     WHERE psm.parent_id = $1 AND psm.student_id = $2::uuid
     LIMIT 1`,
    [parentId, studentId]
  );

  if (!studentRows.rows.length) return null;

  const results = await pool.query(
    `SELECT id, game_name, score, created_at
     FROM (
       SELECT id::text AS id, game_name, score, completed_at AS created_at
       FROM game_results
       WHERE user_id = $1::uuid
     ) q
     ORDER BY created_at DESC`,
    [studentId]
  );

  return {
    student: studentRows.rows[0],
    results: results.rows,
  };
};
