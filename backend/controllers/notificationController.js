// controllers/notificationController.js
const db = require("../supabaseClient");

/* -------------------- GET USER NOTIFICATIONS -------------------- */
const getUserNotifications = async (req, res) => {
  try {
    const { data: notifications, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notifications });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/* -------------------- MARK ONE AS READ -------------------- */
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark notification error:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

/* -------------------- MARK ALL AS READ -------------------- */
const markAllNotificationsRead = async (req, res) => {
  try {
    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

/* -------------------- DELETE NOTIFICATION -------------------- */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db.from("notifications").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

/* -------------------- CREATE & EMIT NOTIFICATION -------------------- */
/*
  BODY EXPECTED:
  {
    user_id: number,    // required
    message: string     // required
  }
*/
const createNotification = async (req, res) => {
  try {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "user_id and message are required" });
    }

    // ✅ Check if user exists
    const { data: user, error: userError } = await db
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userError) throw userError;
    if (!user) {
      return res.status(400).json({ error: `User with ID ${user_id} does not exist` });
    }

    const io = req.app.get("io");

    // 1️⃣ Save notification
    const { data: [notification], error: insertError } = await db
      .from("notifications")
      .insert([{ user_id, message }])
      .select();

    if (insertError) throw insertError;

    notification.is_read = notification.is_read || false;

    // 2️⃣ REAL-TIME EMIT
    io.to(String(user_id)).emit("notification:new", notification);
    console.log("📡 Notification emitted to user:", user_id);

    res.status(201).json({
      message: "Notification sent successfully",
      notification,
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
};
