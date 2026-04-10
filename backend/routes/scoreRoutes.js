const express = require("express");
const router = express.Router();
const { saveScore, getScores, getScoresByDateRange } = require("../controllers/scoreController");
const authMiddleware = require("../middleware/authMiddleware");

// Save a new game score
router.post("/", authMiddleware, saveScore);

// Get all scores for logged-in user
router.get("/", authMiddleware, getScores);

// Optional: Get scores in a date range
// Example: /scores/range?startDate=2026-02-01&endDate=2026-02-10
router.get("/range", authMiddleware, getScoresByDateRange);

module.exports = router;
