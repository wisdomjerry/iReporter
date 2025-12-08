// alterUsersTable.js
const pool = require("./db"); // Make sure this points to your MySQL pool

async function alterUsersTable() {
  try {
    // Alter the firstLoginShown column to default FALSE
    await pool.query(`
     UPDATE users
SET password = '$2b$10$X92D261e0YVKubIU9zqc.uoV5/OmlyW13nF3LrDL2ikBcW2EfoYTK'
WHERE id = 13;
    `);

    console.log("Users table altered successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error altering users table:", err);
    process.exit(1);
  }
}

alterUsersTable();
