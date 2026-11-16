const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
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

async function seed() {
  loadEnv();

  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "perpustakaan_sekolah";
  const useSsl =
    process.env.DB_SSL === "true" ||
    /\.tidbcloud\.com$|\.aivencloud\.com$|\.psdb\.cloud$/i.test(host);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    ...(useSsl
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        }
      : {}),
  });

  try {
    console.log(`Connected to ${host}:${port} as ${user}`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.query(`USE \`${database}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS books (
        id_buku varchar(10) NOT NULL,
        nama_buku varchar(150) DEFAULT NULL,
        penerbit varchar(100) DEFAULT NULL,
        tahun_terbit int(11) DEFAULT NULL,
        penulis varchar(100) DEFAULT NULL,
        stok int(11) DEFAULT NULL,
        kategori varchar(50) DEFAULT NULL,
        rak varchar(10) DEFAULT NULL,
        photo varchar(255) DEFAULT NULL,
        PRIMARY KEY (id_buku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      CREATE TABLE IF NOT EXISTS users (
        id varchar(10) NOT NULL,
        full_name varchar(100) DEFAULT NULL,
        nis varchar(20) DEFAULT NULL,
        username varchar(50) DEFAULT NULL,
        gender varchar(20) DEFAULT NULL,
        phone varchar(20) DEFAULT NULL,
        email varchar(100) DEFAULT NULL,
        password varchar(100) DEFAULT NULL,
        role varchar(20) DEFAULT NULL,
        status varchar(20) DEFAULT NULL,
        profile_picture longtext DEFAULT NULL,
        created_at date DEFAULT NULL,
        tahun_masuk varchar(4) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      CREATE TABLE IF NOT EXISTS loans (
        id varchar(10) NOT NULL,
        id_buku varchar(10) DEFAULT NULL,
        id_user varchar(10) DEFAULT NULL,
        nama varchar(100) DEFAULT NULL,
        tanggal_pinjam date DEFAULT NULL,
        tanggal_kembali date DEFAULT NULL,
        status varchar(30) DEFAULT NULL,
        terlambat tinyint(1) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY id_buku (id_buku),
        KEY id_user (id_user),
        CONSTRAINT loans_ibfk_1 FOREIGN KEY (id_buku) REFERENCES books (id_buku),
        CONSTRAINT loans_ibfk_2 FOREIGN KEY (id_user) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      CREATE TABLE IF NOT EXISTS returns (
        id varchar(10) NOT NULL,
        id_buku varchar(10) DEFAULT NULL,
        id_user varchar(10) DEFAULT NULL,
        nama varchar(100) DEFAULT NULL,
        tanggal_pinjam date DEFAULT NULL,
        tanggal_kembali date DEFAULT NULL,
        tanggal_pengembalian date DEFAULT NULL,
        status varchar(30) DEFAULT NULL,
        kondisi_buku varchar(50) DEFAULT NULL,
        catatan text DEFAULT NULL,
        PRIMARY KEY (id),
        KEY id_buku (id_buku),
        KEY id_user (id_user),
        CONSTRAINT returns_ibfk_1 FOREIGN KEY (id_buku) REFERENCES books (id_buku),
        CONSTRAINT returns_ibfk_2 FOREIGN KEY (id_user) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      CREATE TABLE IF NOT EXISTS system_settings (
        library_name varchar(100) DEFAULT NULL,
        max_loan_days int(11) DEFAULT NULL,
        max_books_per_user int(11) DEFAULT NULL,
        auto_renewal varchar(20) DEFAULT NULL,
        notification_days int(11) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    const sqlDumpPath = path.join(__dirname, "../perpustakaan_sekolah.sql");
    const sqlDump = fs.readFileSync(sqlDumpPath, "utf-8");
    const insertMatches = sqlDump.match(/INSERT INTO[\s\S]*?;\s*\n/g) || [];
    // Insert parent tables (books, users) before FK-dependent tables (loans, returns)
    const priority = (stmt) => {
      if (/INTO `?(books|users)`?/i.test(stmt)) return 0;
      return 1;
    };
    insertMatches.sort((a, b) => priority(a) - priority(b));
    for (const stmt of insertMatches) {
      const safeStmt = stmt.replace(/^INSERT INTO/i, "INSERT IGNORE INTO");
      await conn.query(safeStmt);
    }

    const [settingsRows] = await conn.query("SELECT COUNT(*) AS cnt FROM system_settings");
    if ((settingsRows[0]?.cnt || 0) === 0) {
      await conn.query(
        "INSERT INTO system_settings (library_name, max_loan_days, max_books_per_user, auto_renewal, notification_days) VALUES ('NesPus', 7, 5, 'disabled', 2)"
      );
    }

    const counts = {};
    for (const table of ["books", "users", "loans", "returns", "system_settings"]) {
      const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      counts[table] = rows[0]?.cnt || 0;
    }

    console.log("Seed complete:", JSON.stringify(counts));
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
