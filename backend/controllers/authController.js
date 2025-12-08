const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// ==========================
// REGISTER USER
// ==========================
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, phone || null, "user"]
    );

    const user = {
      id: result.insertId,
      firstName,
      lastName,
      email,
      phone: phone || "",
      role: "user",
      avatar: "", // Cloudinary avatar URL can be updated later
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "Registration successful", user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// LOGIN USER
// ==========================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0)
      return res.status(400).json({ error: "Invalid email or password" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || "",
        firstLoginShown: user.firstLoginShown === 1,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// GET CURRENT LOGGED-IN USER
// ==========================
const getCurrentUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, email, phone, role, avatar, firstLoginShown
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const u = rows[0];

    res.json({
      user: {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        firstLoginShown: u.firstLoginShown === 1,
        avatar: u.avatar || "", // Direct Cloudinary URL
      },
    });
  } catch (err) {
    console.error("CURRENT USER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// MARK FIRST LOGIN POPUP SEEN
// ==========================
const markFirstLoginSeen = async (req, res) => {
  try {
    await db.query("UPDATE users SET firstLoginShown = 1 WHERE id = ?", [
      req.user.id,
    ]);

    res.json({
      success: true,
      message: "First login popup marked as seen",
    });
  } catch (err) {
    console.error("FIRST LOGIN SEEN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// LOGOUT USER
// ==========================
const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });
  res.json({ message: "Logged out successfully" });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  markFirstLoginSeen,
};
