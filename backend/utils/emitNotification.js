// utils/emitNotificationSafe.js
const db = require("../supabaseClient");
const sendEmail = require("./sendEmail");

/**
 * Emit a notification to a user in real-time.
 * Saves to DB and optionally sends email asynchronously.
 * @param {Object} req - Express request (to access io)
 * @param {string|number} userLegacyId - User's legacy_id
 * @param {string} message - Notification message
 * @param {Object} options - Optional settings { sendEmail: true, emailSubject: string }
 */
module.exports = (req, userLegacyId, message, options = {}) => {
  const io = req.app.get("io");

  // Fire-and-forget async function
  (async () => {
    try {
      // 1️⃣ Fetch user by legacy_id
      const { data: user, error: userError } = await db
        .from("users")
        .select("id, email, first_name")
        .eq("legacy_id", userLegacyId)
        .maybeSingle();

      if (userError) throw userError;
      if (!user) throw new Error(`User with legacy_id ${userLegacyId} not found`);

      const actualUserId = user.id;

      // 2️⃣ Save notification to DB (async, does not block socket)
      const { data: [notification], error: insertError } = await db
        .from("notifications")
        .insert([{ user_id: actualUserId, message }])
        .select();

      if (insertError) throw insertError;
      notification.is_read = notification.is_read || false;

      // 3️⃣ Optionally send email (async)
      if (options.sendEmail) {
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

      console.log(`💾 Notification saved for user ${userLegacyId}:`, notification);
    } catch (err) {
      console.error("❌ emitNotification error:", err);
    }
  })();

  // 4️⃣ Emit socket **immediately**, even before DB/email finishes
  const room = String(userLegacyId);
  io.to(room).emit("notification:new", { message, type: "status-update" });
  console.log(`📡 Real-time notification emitted to room ${room}`);
};
