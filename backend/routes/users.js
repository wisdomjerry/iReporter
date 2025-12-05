const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../db");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { storage } = require("../cloudinary"); // Cloudinary storage
const upload = multer({ storage });

const router = express.Router();

// --- GET profile ---
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, first_name, last_name, email, phone, bio, avatar, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      bio: user.bio || "",
      avatar: user.avatar || "", // Cloudinary URL
      role: user.role,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// --- PUT update profile ---
router.put(
  "/profile",
  authMiddleware,
  upload.single("avatar"), // Cloudinary upload
  async (req, res) => {
    try {
      console.log("=== Update Profile Request ===");
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      const { firstName, lastName, bio, phone } = req.body;

      // --- Determine avatar URL ---
      let avatarUrl = null;
      if (req.file) {
        // CloudinaryStorage usually provides the full URL in either path or filename
        avatarUrl = req.file.path || req.file.filename || null;
      }

      console.log("Computed avatarUrl:", avatarUrl);

      // SQL Update
      const updateQuery = `
        UPDATE users
        SET 
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar)
        WHERE id = ?
      `;

      await db.query(updateQuery, [
        firstName,
        lastName,
        phone,
        bio,
        avatarUrl,
        req.user.id,
      ]);

      // Fetch updated user
      const [rows] = await db.query(
        "SELECT id, first_name, last_name, email, phone, bio, avatar, role FROM users WHERE id = ?",
        [req.user.id]
      );

      if (!rows.length)
        return res.status(404).json({ message: "User not found after update" });

      const updatedUser = rows[0];

      res.json({
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio || "",
        avatar: updatedUser.avatar || "", // Full Cloudinary URL
        role: updatedUser.role,
      });
    } catch (err) {
      console.error("Update profile error:", {
        message: err.message,
        stack: err.stack,
        full: JSON.stringify(err, null, 2),
      });
      // full error
      res.status(500).json({
        message: "Failed to update profile",
        error: err.message, // expose error message temporarily for debugging
      });
    }
  }
);

// --- PUT change password ---
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [user] = await db.query("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (!user.length)
      return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user[0].password);
    if (!match)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

module.exports = router;
