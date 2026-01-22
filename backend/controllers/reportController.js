// controllers/reportController.js
const db = require("../supabaseClient"); // Supabase client
const sendEmail = require("../utils/sendEmail");
const emitNotification = require("../utils/emitNotificationSafe");

/* ================= CREATE REPORT ================= */
exports.createReport = async (req, res) => {
  try {
    const user = req.user; // user object from auth middleware
    const { title, description, location, type = "general", lat, lng } = req.body;

    if (!title || !description || !location)
      return res.status(400).json({ error: "Missing required fields" });

    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    let mediaPaths = [];
    if (Array.isArray(req.files)) {
      mediaPaths = req.files.map(
        (f) => `/uploads/${f.destination.split("/")[1]}/${f.filename}`
      );
    }

    // 1️⃣ Create the report
    const { data: [report], error } = await db
      .from("reports")
      .insert([{
        user_id: user.id, // keep DB foreign key
        title,
        description,
        type,
        status: "pending",
        location,
        lat: parsedLat,
        lng: parsedLng,
        media: JSON.stringify(mediaPaths),
      }])
      .select();

    if (error) throw error;
    report.media = JSON.parse(report.media || "[]");

    const message = `📝 New report submitted: ${title}`;
    const io = req.app.get("io");

    // 2️⃣ Fetch admins (include legacy_id for sockets)
    const { data: admins } = await db
      .from("users")
      .select("id, legacy_id, email")
      .eq("role", "admin");

    for (const admin of admins || []) {
      const adminRoomId = admin.legacy_id || admin.id;

      // Emit socket notification (online)
      await emitNotification(req, adminRoomId, message, {
        sendEmail: true,
        emailSubject: "New Report Submitted",
      });

      // Also emit a socket update (optional, frontend may listen)
      io.to(String(adminRoomId)).emit("notification:new", {
        type: "new-report",
        message,
        report,
      });
    }

    res.status(201).json({ message: "Report created", report });
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= GET ALL REPORTS ================= */
exports.getAllReports = async (_, res) => {
  try {
    const { data, error } = await db
      .from("reports")
      .select(`
        id,
        title,
        description,
        type,
        status,
        location,
        lat,
        lng,
        media,
        created_at,
        user_id,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json((data || []).map(r => ({
      ...r,
      media: r.media ? JSON.parse(r.media) : [],
      userName: r.users
        ? `${r.users.first_name} ${r.users.last_name}`.trim()
        : "Unknown",
    })));
  } catch (err) {
    console.error("Get all reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= GET USER REPORTS ================= */
exports.getUserReports = async (req, res) => {
  try {
    const { data: rows, error } = await db
      .from("reports")
      .select("*, user:user_id(first_name, last_name, email, legacy_id)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reports = (rows || []).map(r => ({
      ...r,
      media: r.media ? JSON.parse(r.media) : [],
      userName: r.user
        ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() || r.user.email
        : "Unknown",
    }));

    // Emit real-time update to user using legacy_id room
    const io = req.app.get("io");
    const roomId = req.user.legacy_id || req.user.id;
    io.to(String(roomId)).emit("user-reports", { reports });

    res.json(reports);
  } catch (err) {
    console.error("Get user reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= UPDATE REPORT STATUS ================= */
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "under-investigation", "resolved", "rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

    await db.from("reports").update({ status }).eq("id", id);

    const { data: report } = await db
      .from("reports")
      .select("*, user:user_id(first_name, last_name, email, legacy_id)")
      .eq("id", id)
      .single();

    if (!report) return res.status(404).json({ error: "Report not found" });

    const message = `Your report "${report.title}" status has been updated to "${status}"`;
    const io = req.app.get("io");

    // Emit notification using legacy_id
    const userRoomId = report.user.legacy_id || report.user_id;
    await emitNotification(req, userRoomId, message, { sendEmail: true, emailSubject: "Report Status Updated" });

    // Emit real-time report update
    io.to(String(userRoomId)).emit("report:updated", report);

    res.json({ message: "Status updated", report });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= DELETE REPORT ================= */
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: report } = await db.from("reports").select("*").eq("id", id).single();

    if (!report || report.user_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    await db.from("reports").delete().eq("id", id);

    const message = `Your report "${report.title}" was deleted`;
    const io = req.app.get("io");

    const roomId = req.user.legacy_id || req.user.id;
    await emitNotification(req, roomId, message, { sendEmail: true });

    io.to(String(roomId)).emit("notification:new", { type: "report-deleted", message, reportId: id });

    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
