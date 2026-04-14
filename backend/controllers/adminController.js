const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const admin = await adminModel.findAdminByEmail(email);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: "admin", adminRole: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
        adminRole: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ message: "Admin login failed" });
  }
};

exports.getDashboard = async (_req, res) => {
  try {
    const analytics = await adminModel.getPlatformAnalytics();
    const students = await adminModel.getAllStudents();
    const parents = await adminModel.getAllParents();

    return res.json({
      stats: analytics,
      total_students_listed: students.length,
      total_parents_listed: parents.length,
    });
  } catch (error) {
    console.error("Admin dashboard failed:", error);
    return res.status(500).json({ message: "Failed to load admin dashboard" });
  }
};

exports.getStudents = async (_req, res) => {
  try {
    const students = await adminModel.getAllStudents();
    return res.json({ students });
  } catch (error) {
    console.error("Get students failed:", error);
    return res.status(500).json({ message: "Failed to fetch students" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await adminModel.deleteStudent(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Student not found" });
    return res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student failed:", error);
    return res.status(500).json({ message: "Failed to delete student" });
  }
};

exports.getAnalytics = async (_req, res) => {
  try {
    const stats = await adminModel.getPlatformAnalytics();
    const parents = await adminModel.getAllParents();
    return res.json({
      ...stats,
      parent_accounts: parents,
    });
  } catch (error) {
    console.error("Admin analytics failed:", error);
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
