const express = require("express");
const router = express.Router();
const { saveProgress, getUserStats } = require("../controllers/progressController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, saveProgress);
router.get("/stats", auth, getUserStats);

module.exports = router;
