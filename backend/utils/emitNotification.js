// utils/emitNotificationSafe.js
const db = require("../supabaseClient");
const sendEmail = require("./sendEmail");

module.exports = async (req, userId, message, options = {}) => {
  // options: { sendEmail: true, emailSubject: string }

  const io = req.app.get("io");

  // 1️⃣ Save notification to DB
  const { data: [notification], error } = await db
    .from("notifications")
    .insert([{ user_id: userId, message }])
    .select();

  if (error) throw error;
  notification.is_read = notification.is_read || false;

  // 2️⃣ Emit socket notification if user is connected
  const room = String(userId);
  const clients = io.sockets.adapter.rooms.get(room);

  if (!clients || clients.size === 0) {
    console.warn(`⚠️ User ${userId} is not in Socket.IO room "${room}".`);
    console.log("Notification saved to DB:", notification);
  } else {
    io.to(room).emit("notification:new", notification);
    console.log(`📡 Notification emitted to user ${userId}, sockets:`, clients);
  }

  // 3️⃣ Optionally send email
  if (options.sendEmail) {
    try {
      // Fetch user email
      const { data: user, error: userError } = await db
        .from("users")
        .select("email, first_name")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      if (!user?.email) return notification;

      await sendEmail({
        to: user.email,
        subject: options.emailSubject || "New Notification",
        text: message,
        html: `<p>${message}</p>`,
      });

      console.log(`📧 Email sent to user: ${user.email}`);
    } catch (err) {
      console.error("❌ Failed to send notification email:", err);
    }
  }

  return notification;
};
