// utils/sendEmailGmail.js
const nodemailer = require("nodemailer");

// Read Gmail credentials from environment variables
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.error("❌ Gmail credentials are missing! Emails will not be sent.");
}

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

/**
 * Send an email via Gmail SMTP
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Email subject
 * @param {string} param0.text - Plain text body

 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn("⚠️ Skipping email send due to missing Gmail credentials.");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"iReporter Notifications" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};

module.exports = sendEmail;
