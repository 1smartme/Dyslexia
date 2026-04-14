const pool = require("../lib/postgres");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, username, firstName, lastName, email, password } = req.body;
  const resolvedUsername =
    name ||
    username ||
    (firstName && lastName ? `${firstName} ${lastName}` : undefined);

  if (!resolvedUsername || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, is_admin)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, username, email, is_admin, created_at`,
      [resolvedUsername, email, hashedPassword]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.is_admin ? "admin" : "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        role: user.is_admin ? "admin" : "student",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

