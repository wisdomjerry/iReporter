// controllers/reportController.js
const db = require("../db");
const sendEmail = require("../utils/sendEmail");

// --- CREATE REPORT ---
exports.createReport = async (req, res) => {
  try {
    const user = req.user;

    const body = req.body || {};
    const {
      title = "",
      description = "",
      location = "",
      type = "general",
      lat,
      lng,
    } = body;

    if (!title.trim() || !description.trim() || !location.trim()) {
      return res.status(400).json({
        error: "Title, description, and location are required",
      });
    }

    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    // Handle multiple files from multer
    let mediaPaths = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      mediaPaths = req.files.map(
        (file) => `/uploads/${file.destination.split("/")[1]}/${file.filename}`
      );
    }

    // Insert report
    const [result] = await db.query(
      `INSERT INTO reports 
        (user_id, title, description, type, status, location, lat, lng, media)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        title,
        description,
        type,
        "pending",
        location,
        parsedLat,
        parsedLng,
        JSON.stringify(mediaPaths),
      ]
    );

    // Mark first login as shown (so popup disappears permanently)
    await db.query(
      "UPDATE users SET firstLoginShown = 1 WHERE id = ? AND firstLoginShown = 0",
      [user.id]
    );

    // Fetch inserted report
    const [rows] = await db.query("SELECT * FROM reports WHERE id = ?", [
      result.insertId,
    ]);
    const report = rows[0];
    report.media = JSON.parse(report.media || "[]");

    // Notify admin
    const ADMIN_ID = 1;
    const [userRow] = await db.query(
      "SELECT first_name, last_name, email FROM users WHERE id = ?",
      [user.id]
    );
    const firstName = userRow[0]?.first_name || "";
    const lastName = userRow[0]?.last_name || "";
    const email = userRow[0]?.email || "Unknown";
    const displayName =
      firstName || lastName ? `${firstName} ${lastName}`.trim() : email;

    const message = `New report created by ${displayName}: ${title}`;
    await db.execute(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [ADMIN_ID, message]
    );

    await sendEmail({
      to: process.env.ADMIN_EMAIL || "wisdomjeremiah57@gmail.com",
      subject: "New Report Created",
      text: message,
    });

    return res
      .status(201)
      .json({ message: "Report created successfully", report });
  } catch (err) {
    console.error("Create report error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// --- GET ALL REPORTS ---
exports.getAllReports = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.id as user_id, u.first_name, u.last_name, u.email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    rows.forEach((r) => (r.media = r.media ? JSON.parse(r.media) : []));
    const mappedRows = rows.map((r) => ({
      ...r,
      createdBy: r.user_id,
      userName: `${r.first_name} ${r.last_name}`.trim(),
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error("Get all reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- GET USER REPORTS ---
exports.getUserReports = async (req, res) => {
  try {
    // Fetch user reports
    const [rows] = await db.query(
      "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    rows.forEach((r) => (r.media = r.media ? JSON.parse(r.media) : []));
    const reports = rows.map((r) => ({ ...r, createdBy: r.user_id }));

    // Fetch firstLoginShown for this user
    const [userRows] = await db.query(
      "SELECT firstLoginShown FROM users WHERE id = ?",
      [req.user.id]
    );

    const firstLoginShown = userRows[0]?.firstLoginShown === 1;

    // Return both reports and firstLoginShown
    res.json({ reports, firstLoginShown });
  } catch (err) {
    console.error("Get user reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- UPDATE REPORT STATUS ---
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status)
      return res.status(400).json({ error: "Status field is required" });
    const allowed = ["pending", "under-investigation", "resolved", "rejected"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status value" });

    await db.query("UPDATE reports SET status = ? WHERE id = ?", [status, id]);

    const [reportRows] = await db.query("SELECT * FROM reports WHERE id = ?", [
      id,
    ]);
    const report = reportRows[0];
    if (!report) return res.status(404).json({ error: "Report not found" });

    const [userRows] = await db.query(
      "SELECT email, first_name, last_name FROM users WHERE id = ?",
      [report.user_id]
    );
    if (!userRows?.length)
      return res.status(500).json({ error: "Report owner not found" });

    const user = userRows[0];
    const emailMessage = `Hello ${user.first_name} ${user.last_name}, your report "${report.title}" status has been updated to "${status}".`;

    await db.execute(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [report.user_id, emailMessage]
    );

    sendEmail({
      to: user.email,
      subject: `Report Status Updated: ${report.title}`,
      text: emailMessage,
    }).catch((err) => console.error("Error sending status update email:", err));

    res.json({ message: "Report status updated successfully" });
  } catch (err) {
    console.error("Update report status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --- DELETE REPORT ---
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [report] = await db.query("SELECT * FROM reports WHERE id = ?", [id]);
    if (!report.length)
      return res.status(404).json({ error: "Report not found" });
    if (userId !== report[0].user_id)
      return res.status(403).json({ error: "Unauthorized" });

    await db.query("DELETE FROM reports WHERE id = ?", [id]);
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
