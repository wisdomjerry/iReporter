// alterUsersTable.js
const pool = require("./db"); // Make sure this points to your MySQL pool

async function alterUsersTable() {
  try {
    // Alter the firstLoginShown column to default FALSE
    await pool.query(`
     UPDATE users
SET firstLoginShown = 0
WHERE id = 1; 


    `);

    console.log("Users table altered successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error altering users table:", err);
    process.exit(1);
  }
}

alterUsersTable();
