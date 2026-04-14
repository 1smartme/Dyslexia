const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const parentModel = require("../models/parentModel");

const buildParentToken = (parent) =>
  jwt.sign({ id: parent.id, email: parent.email, role: "parent" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

const computeAnalytics = (results) => {
  const safeResults = Array.isArray(results) ? results : [];
  const totalGamesPlayed = safeResults.length;
  const averageScore = totalGamesPlayed
    ? safeResults.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalGamesPlayed
    : 0;
  const lastActivity = totalGamesPlayed ? safeResults[0].created_at : null;
  return {
    average_score: Number(averageScore.toFixed(2)),
    total_games_played: totalGamesPlayed,
    last_activity: lastActivity,
  };
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const existing = await parentModel.findParentByEmail(email);
    if (existing) return res.status(409).json({ message: "Parent email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const parent = await parentModel.createParent({
      name,
      email,
      password: hashedPassword,
    });

    const token = buildParentToken(parent);
    return res.status(201).json({
      message: "Parent registered successfully",
      token,
      user: { ...parent, role: "parent" },
    });
  } catch (error) {
    console.error("Parent signup failed:", error);
    return res.status(500).json({ message: "Parent signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const parent = await parentModel.findParentByEmail(email);
    if (!parent) return res.status(404).json({ message: "Parent not found" });

    const isValid = await bcrypt.compare(password, parent.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = buildParentToken(parent);
    return res.json({
      token,
      user: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        role: "parent",
      },
    });
  } catch (error) {
    console.error("Parent login failed:", error);
    return res.status(500).json({ message: "Parent login failed" });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const parentId = req.user.id;
    const students = await parentModel.getParentStudents(parentId);

    const withAnalytics = await Promise.all(
      students.map(async (student) => {
        const payload = await parentModel.getStudentResultsForParent(parentId, student.id);
        return {
          ...student,
          analytics: computeAnalytics(payload?.results || []),
        };
      })
    );

    return res.json({
      parent_id: parentId,
      total_children: withAnalytics.length,
      children: withAnalytics,
    });
  } catch (error) {
    console.error("Parent dashboard failed:", error);
    return res.status(500).json({ message: "Failed to load parent dashboard" });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const parentId = req.user.id;
    const studentId = req.params.id;
    const payload = await parentModel.getStudentResultsForParent(parentId, studentId);
    if (!payload) return res.status(404).json({ message: "Student not linked to this parent" });

    return res.json({
      student: payload.student,
      analytics: computeAnalytics(payload.results),
      results: payload.results,
    });
  } catch (error) {
    console.error("Parent student results failed:", error);
    return res.status(500).json({ message: "Failed to load student results" });
  }
};
