// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabaseClient");

/* =========================
   Helper: Set JWT Cookie
========================= */
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,        // required on Render / HTTPS
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

/* =========================
   REGISTER USER
========================= */
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("legacy_id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: "user",
        },
      ])
      .select("legacy_id, first_name, last_name, email, phone, role, avatar, firstLoginShown")
      .single();

    if (error) throw error;

    // JWT uses legacy_id ONLY
    const token = jwt.sign(
      {
        uid: user.legacy_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    setTokenCookie(res, token);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.legacy_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        avatar: user.avatar || "",
        firstLoginShown: user.firstLoginShown || false,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   LOGIN USER
========================= */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // JWT → legacy_id
    const token = jwt.sign(
      {
        uid: user.legacy_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    setTokenCookie(res, token);

    res.json({
      message: "Login successful",
      user: {
        id: user.legacy_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        avatar: user.avatar || "",
        firstLoginShown: user.firstLoginShown || false,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   LOGOUT USER
========================= */
const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });

  res.json({ message: "Logged out successfully" });
};

/* =========================
   MARK FIRST LOGIN SEEN
========================= */
const markFirstLoginSeen = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await supabase
      .from("users")
      .update({ firstLoginShown: true })
      .eq("legacy_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error("FIRST LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* =========================
   GET CURRENT USER (/me)
========================= */
const getCurrentUser = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: u, error } = await supabase
      .from("users")
      .select(
        "legacy_id, first_name, last_name, email, phone, role, avatar, firstLoginShown"
      )
      .eq("legacy_id", req.user.id)
      .single();

    if (error || !u) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: u.legacy_id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone || "",
        role: u.role,
        avatar: u.avatar || "",
        firstLoginShown: u.firstLoginShown || false,
      },
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  markFirstLoginSeen,
  getCurrentUser,
};
