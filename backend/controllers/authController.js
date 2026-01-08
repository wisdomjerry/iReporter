// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabaseClient");

// Helper to set cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

// ==========================
// REGISTER USER
// ==========================
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    // Check if email exists
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing)
      return res.status(400).json({ error: "Email already exists" });
    if (selectError && selectError.code !== "PGRST116")
      return res.status(500).json({ error: selectError.message });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data: insertedUser, error: insertError } = await supabase
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
      .select()
      .single();

    if (insertError)
      return res.status(500).json({ error: insertError.message });

    // Generate JWT & set cookie
    const token = jwt.sign(
      {
        id: insertedUser.id,
        email: insertedUser.email,
        role: insertedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    setTokenCookie(res, token);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: insertedUser.id,
        firstName: insertedUser.first_name,
        lastName: insertedUser.last_name,
        email: insertedUser.email,
        phone: insertedUser.phone || "",
        role: insertedUser.role,
        avatar: insertedUser.avatar || "",
        firstLoginShown: insertedUser.firstLoginShown || false,
      },
    });
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
  console.log("Controller: /login called with", { email });

  if (!email || !password) {
    console.log("Controller: Missing email or password");
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    console.log("Controller: Supabase returned:", { user, error });

    if (error) {
      console.error("Controller: Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      console.log("Controller: User not found for email", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("Controller: Password valid?", valid);

    if (!valid) {
      console.log("Controller: Password mismatch");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Controller: JWT created:", token);

    setTokenCookie(res, token);
    console.log("Controller: Cookie set");

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        avatar: user.avatar || "",
        firstLoginShown: user.firstLoginShown || false,
      },
    });
    console.log("Controller: Response sent");
  } catch (err) {
    console.error("Controller: LOGIN ERROR (catch):", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// LOGOUT USER
// ==========================
const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });

  res.json({ message: "Logged out successfully" });
};

// ==========================
// MARK FIRST LOGIN POPUP SEEN
// ==========================
const markFirstLoginSeen = async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  try {
    await supabase
      .from("users")
      .update({ firstLoginShown: true })
      .eq("id", req.user.id);
    res.json({ success: true, message: "First login popup marked as seen" });
  } catch (err) {
    console.error("FIRST LOGIN SEEN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// GET CURRENT LOGGED-IN USER
// ==========================
const getCurrentUser = async (req, res) => {
  console.log("Controller: /me called");
  console.log("Controller: req.user =", req.user);

  if (!req.user?.id) {
    console.log("Controller: req.user.id is missing!");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: u, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, phone, role, avatar, firstLoginShown"
      )
      .eq("id", req.user.id)
      .maybeSingle();

    console.log("Controller: Supabase returned:", { u, error });

    if (error) {
      console.error("Controller: Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }
    if (!u) {
      console.log("Controller: No user found for id", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: u.id,
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
    console.error("Controller: CURRENT USER ERROR:", err);
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
