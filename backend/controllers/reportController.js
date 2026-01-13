// controllers/reportController.js
const db = require("../supabaseClient"); // Supabase client
const sendEmail = require("../utils/sendEmail");
const emitNotification = require("../utils/emitNotification");

/* ================= CREATE REPORT ================= */
exports.createReport = async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      location,
      type = "general",
      lat,
      lng,
    } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    let mediaPaths = [];
    if (Array.isArray(req.files)) {
      mediaPaths = req.files.map(
        (f) => `/uploads/${f.destination.split("/")[1]}/${f.filename}`
      );
    }

    const {
      data: [report],
      error,
    } = await db
      .from("reports")
      .insert([
        {
          user_id: user.id,
          title,
          description,
          type,
          status: "pending",
          location,
          lat: parsedLat,
          lng: parsedLng,
          media: JSON.stringify(mediaPaths),
        },
      ])
      .select();

    if (error) throw error;
    report.media = JSON.parse(report.media || "[]");

    // --- Fetch admins ---
    const { data: admins } = await db
      .from("users")
      .select("id, email")
      .eq("role", "admin");

    const message = `📝 New report submitted: ${title}`;
    const io = req.app.get("io");

    for (const admin of admins || []) {
      // DB + socket notification
      await emitNotification(req, admin.id, message);

      io.to(String(admin.id)).emit("notification:new", {
        type: "new-report",
        message,
        report,
      });

      // --- Send email to admin ---
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: `New Report Submitted by ${user.first_name || user.email}`,
          text: `A new report titled "${title}" was submitted.\n\nDescription: ${description}\nType: ${type}\nLocation: ${location}`,
        });
        console.log(`📧 Email sent to admin: ${admin.email}`);
      }
    }

    res.status(201).json({ message: "Report created", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= GET ALL REPORTS ================= */
exports.getAllReports = async (_, res) => {
  try {
    const { data, error } = await db
      .from("reports")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(
      (data || []).map((r) => ({
        ...r,
        media: r.media ? JSON.parse(r.media) : [],
        userName: r.users
          ? `${r.users.first_name} ${r.users.last_name}`.trim()
          : "Unknown",
      }))
    );
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
      .select("*, user:user_id(first_name, last_name, email)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reports = (rows || []).map((r) => ({
      ...r,
      media: r.media ? JSON.parse(r.media) : [],
      userName: r.user
        ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() ||
          r.user.email
        : "Unknown",
    }));

    // Emit real-time update to the user
    const io = req.app.get("io");
    io.to(String(req.user.id)).emit("user-reports", { reports });

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
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // 1️⃣ Update status in DB
    await db.from("reports").update({ status }).eq("id", id);

    // 2️⃣ Fetch the updated report including user info
    const { data: report } = await db
      .from("reports")
      .select("*, user:user_id(first_name, last_name, email)")
      .eq("id", id)
      .single();

    if (!report) return res.status(404).json({ error: "Report not found" });

    const message = `Your report "${report.title}" status has been updated to "${status}"`;

    const io = req.app.get("io");

    // 3️⃣ Emit socket notification
    await emitNotification(req, report.user_id, message);
    io.to(String(report.user_id)).emit("notification:new", {
      type: "status-update",
      message,
      report,
    });

    // 4️⃣ Emit real-time report update
    io.to(String(report.user_id)).emit("report:updated", report);

    // 5️⃣ Send email to the user
    if (report.user?.email) {
      await sendEmail({
        to: report.user.email,
        subject: `Report Status Updated: ${report.title}`,
        text: message,
        html: `<p>${message}</p>`,
      });
      console.log(`📧 Email sent to ${report.user.email}`);
    }

    res.json({ message: "Status updated", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= DELETE REPORT ================= */
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: report } = await db
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (!report || report.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.from("reports").delete().eq("id", id);

    const message = `Your report "${report.title}" was deleted`;

    const io = req.app.get("io");

    await emitNotification(req, req.user.id, message);

    io.to(String(req.user.id)).emit("notification:new", {
      type: "report-deleted",
      message,
      reportId: id,
    });

    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
