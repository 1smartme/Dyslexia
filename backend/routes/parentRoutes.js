const express = require("express");
const parentController = require("../controllers/parentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/signup", parentController.signup);
router.post("/login", parentController.login);
router.get("/dashboard", authMiddleware, roleMiddleware("parent", "admin"), parentController.getDashboard);
router.get(
  "/student/:id/results",
  authMiddleware,
  roleMiddleware("parent", "admin"),
  parentController.getStudentResults
);

module.exports = router;
