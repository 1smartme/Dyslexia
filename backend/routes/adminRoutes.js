const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", adminController.login);
router.get("/dashboard", authMiddleware, roleMiddleware("admin"), adminController.getDashboard);
router.get("/students", authMiddleware, roleMiddleware("admin"), adminController.getStudents);
router.delete("/student/:id", authMiddleware, roleMiddleware("admin"), adminController.deleteStudent);
router.get("/analytics", authMiddleware, roleMiddleware("admin"), adminController.getAnalytics);

module.exports = router;
