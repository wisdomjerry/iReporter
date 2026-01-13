const express = require("express");
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

// --- CREATE NOTIFICATION ---
router.post("/", authMiddleware, createNotification);

// --- GET logged-in user notifications ---
router.get("/", authMiddleware, getUserNotifications);

// --- MARK notification as read ---
router.put("/:id/read", authMiddleware, markNotificationRead);

// --- Mark all notifications as read
router.put("/mark-all-read", authMiddleware, markAllNotificationsRead);

// --- DELETE a notification ---
router.delete("/", authMiddleware, deleteAllNotifications);

router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
