const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Ensure .env is loaded if this module is required directly
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (process.env[k] === undefined) process.env[k] = v;
        }
      }
    });
}

const dbHost = process.env.DB_HOST || "localhost";
const requiresSsl =
  process.env.DB_SSL === "true" ||
  /\.tidbcloud\.com$|\.aivencloud\.com$|\.psdb\.cloud$/i.test(dbHost);

// Connection pool for local MySQL or cloud MySQL (e.g. TiDB Cloud Starter)
const pool = mysql.createPool({
  host: dbHost,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "perpustakaan_sekolah",
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  ...(requiresSsl
    ? {
        ssl: {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        },
      }
    : {}),
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  pool,
  query,
};





