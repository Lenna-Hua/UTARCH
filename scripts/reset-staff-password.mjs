import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("Usage: node scripts/reset-staff-password.mjs <email> <newPassword>");
  console.log("Password must be at least 12 characters.");
  process.exit(1);
}

if (newPassword.length < 12) {
  console.error("Error: New password must be at least 12 characters.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    "UPDATE staff_users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email",
    [hash, email]
  );

  if (result.rowCount === 0) {
    console.error(`Error: No staff user found with email "${email}"`);
    const users = await pool.query("SELECT id, name, email FROM staff_users");
    console.log("Existing staff accounts:");
    console.table(users.rows);
  } else {
    console.log(`Password successfully updated for user:`, result.rows[0]);
  }
} catch (err) {
  console.error("Database error:", err.message);
} finally {
  await pool.end();
}
