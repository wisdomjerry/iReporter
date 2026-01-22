// utils/emitNotificationSafe.js
const db = require("../supabaseClient");
const sendEmail = require("./sendEmail");

/**
 * Emit a notification to a user, optionally send email.
 * Works whether user is online or offline.
 * @param {Object} req - Express request (to access io)
 * @param {string|number} userLegacyId - User's legacy_id
 * @param {string} message - Notification message
 * @param {Object} options - Optional settings { sendEmail: true, emailSubject: string }
 * @returns {Object} The saved notification
 */
module.exports = async (req, userLegacyId, message, options = {}) => {
  const io = req.app.get("io");

  // 1️⃣ Fetch user by legacy_id
  const { data: user, error: userError } = await db
    .from("users")
    .select("id, email, first_name")
    .eq("legacy_id", userLegacyId)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new Error(`User with legacy_id ${userLegacyId} not found`);

  const actualUserId = user.id; // uuid column

  // 2️⃣ Save notification to DB
  const { data: [notification], error: insertError } = await db
    .from("notifications")
    .insert([{ user_id: actualUserId, message }])
    .select();

  if (insertError) throw insertError;
  notification.is_read = notification.is_read || false;

  // 3️⃣ Emit socket notification if user is connected
  const room = String(userLegacyId); // use legacy_id as socket room
  const clients = io.sockets.adapter.rooms.get(room);

  if (!clients || clients.size === 0) {
    console.log(`⚠️ User ${userLegacyId} is offline. Notification saved:`, notification);
  } else {
    io.to(room).emit("notification:new", notification);
    console.log(`📡 Notification emitted to user ${userLegacyId}, sockets:`, clients);
  }

  // 4️⃣ Optionally send email if offline or forced
  if (options.sendEmail || !clients || clients.size === 0) {
    if (user.email) {
      try {
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
  }

  return notification;
};
