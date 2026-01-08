// utils/emitNotificationSafe.js
module.exports = async (req, userId, message) => {
  const db = require("../supabaseClient");
  const io = req.app.get("io");

  // 1️⃣ Save notification to DB
  const { data: [notification], error } = await db
    .from("notifications")
    .insert([{ user_id: userId, message }])
    .select();

  if (error) throw error;
  notification.is_read = notification.is_read || false;

  // 2️⃣ Check if user is in any room
  const room = String(userId);
  const clients = io.sockets.adapter.rooms.get(room);

  if (!clients || clients.size === 0) {
    console.warn(`⚠️ User ${userId} is not currently registered in Socket.IO room "${room}".`);
    console.log("All rooms:", Array.from(io.sockets.adapter.rooms.entries()));
    console.log("Notification saved to DB but not emitted yet:", notification);
    return notification; // still return saved notification
  }

  // 3️⃣ Emit notification
  io.to(room).emit("notification:new", notification);
  console.log(`📡 Notification emitted to user ${userId}, sockets:`, clients);

  return notification;
};
