// controllers/reportController.js
const db = require("../supabaseClient"); // Supabase client
const sendEmail = require("../utils/sendEmail");
const emitNotification = require("../utils/emitNotification");

/* ================= CREATE REPORT ================= */
exports.createReport = async (req, res) => {
  try {
    const user = req.user; // user object from auth middleware
    const {
      title,
      description,
      location,
      type = "general",
      lat,
      lng,
    } = req.body;

    if (!title || !description || !location)
      return res.status(400).json({ error: "Missing required fields" });

    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    let mediaPaths = [];
    if (Array.isArray(req.files)) {
      mediaPaths = req.files.map(
        (f) => `/uploads/${f.destination.split("/")[1]}/${f.filename}`,
      );
    }

    // 1️⃣ Create the report
    const {
      data: [report],
      error,
    } = await db
      .from("reports")
      .insert([
        {
          user_id: user.id, // keep DB foreign key
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
        users:users!reports_user_id_fkey (
          first_name,
          last_name,
          email,
          legacy_id
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reports = (data || []).map((r) => ({
      ...r,
      media: r.media ? JSON.parse(r.media) : [],
      userName: r.users
        ? `${r.users.first_name} ${r.users.last_name}`.trim()
        : "Unknown",
      userLegacyId: r.users?.legacy_id || null,
    }));

    res.json(reports);
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
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reports = (rows || []).map((r) => ({
      ...r,
      media: r.media ? JSON.parse(r.media) : [],
    }));

    // Socket update using legacy_id room
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
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    // 1️⃣ Fetch the report
    const { data: report, error: fetchError } = await db
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !report)
      return res.status(404).json({ error: "Report not found" });

    // 2️⃣ Update status
    const { error: updateError } = await db
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (updateError) throw updateError;

    const updatedReport = { ...report, status };
    const message = `Your report "${report.title}" status has been updated to "${status}"`;
    const io = req.app.get("io");

    // 3️⃣ Emit socket **immediately** to user
    const userRoomId = report.user_id; // or legacy_id if your frontend uses it
    io.to(String(userRoomId)).emit("report:updated", updatedReport);
    io.to(String(userRoomId)).emit("notification:new", {
      message,
      type: "status-update",
      report: updatedReport,
    });

    // 4️⃣ Fire-and-forget DB + email
    (async () => {
      try {
        await db
          .from("notifications")
          .insert([{ user_id: report.user_id, message }]);
        // optionally send email
        const { data: user } = await db
          .from("users")
          .select("email, first_name")
          .eq("id", report.user_id)
          .single();

        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: "Report Status Updated",
            text: message,
            html: `<p>${message}</p>`,
          });
        }
      } catch (err) {
        console.error("Background notification/email error:", err);
      }
    })();

    // 5️⃣ Respond to admin immediately
    res.json({ message: "Status updated", report: updatedReport });
  } catch (err) {
    console.error("Update status error:", err);
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

    if (!report || report.user_id !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    await db.from("reports").delete().eq("id", id);

    const message = `Your report "${report.title}" was deleted`;
    const io = req.app.get("io");

    const roomId = req.user.legacy_id || req.user.id;
    await emitNotification(req, roomId, message, { sendEmail: true });

    io.to(String(roomId)).emit("notification:new", {
      type: "report-deleted",
      message,
      reportId: id,
    });

    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
