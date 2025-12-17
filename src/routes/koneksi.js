const mysql = require('mysql2');

// Single reusable connection for now; switch to createPool if you need concurrency.
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'perpustakaan_sekolah',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

module.exports = db;