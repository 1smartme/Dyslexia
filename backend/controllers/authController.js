const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, username, firstName, lastName, email, password } = req.body;
  const fullName =
    name ||
    username ||
    (firstName && lastName ? `${firstName} ${lastName}` : undefined);

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [fullName, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(400).json({ error: err });

        res.json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(400).json({ message: "User not found" });

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }
  );
};

