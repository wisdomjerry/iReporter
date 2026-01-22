const supabase = require("../supabaseClient");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer") token = parts[1];
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 IMPORTANT: legacy_id, NOT id
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("legacy_id", decoded.uid) // ✅ FIXED
      .single();

    if (error || !user) {
      console.error("❌ User not found for legacy_id:", decoded.uid);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Normalize req.user for the app
    req.user = {
      id: user.legacy_id,     // ✅ use legacy_id everywhere
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { authMiddleware };
