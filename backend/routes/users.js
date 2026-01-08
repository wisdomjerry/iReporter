const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const {
  getProfile,
  updateProfile,
  markFirstLoginShown,
} = require("../controllers/userController");

const supabase = require("../supabaseClient");
const bcrypt = require("bcrypt");

const router = express.Router();

/**
 * =========================
 * GET logged-in user profile
 * =========================
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * =========================
 * UPDATE profile (avatar + bio)
 * =========================
 */
router.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfile
);

/**
 * =========================
 * MARK first login modal as shown
 * =========================
 */
router.put(
  "/first-login-shown",
  authMiddleware,
  markFirstLoginShown
);

/**
 * =========================
 * CHANGE password
 * =========================
 */
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("password")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", req.user.id);

    if (updateError) throw updateError;

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      message: "Failed to change password",
      error: err.message,
    });
  }
});

module.exports = router;
