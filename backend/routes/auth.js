// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const supabase = require("../supabaseClient");

router.post("/register", authController.registerUser);
router.put("/first-login-shown", authMiddleware, async (req, res) => {
  try {
    await supabase
      .from("users")
      .update({ firstloginshown: true })
      .eq("id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error("First login update error:", err);
    res.status(500).json({ error: "Failed to update first login flag" });
  }
});

router.post("/login", authController.loginUser);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.post("/logout", authController.logoutUser);

module.exports = router;
