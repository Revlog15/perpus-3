const { query } = require('./index');

async function getAll() {
  return query(
    'SELECT id, full_name AS fullName, username, email, phone AS telepon, password, nis, gender, tahun_masuk AS tahunMasuk, role, status, profile_picture AS profilePicture, created_at AS createdAt FROM users',
    []
  );
}

async function getById(id) {
  const rows = await query(
    'SELECT id, full_name AS fullName, username, email, phone AS telepon, password, nis, gender, tahun_masuk AS tahunMasuk, role, status, profile_picture AS profilePicture, created_at AS createdAt FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByIdentifier(identifier) {
  const rows = await query(
    `SELECT * FROM users 
     WHERE LOWER(email) = LOWER(?) 
        OR LOWER(username) = LOWER(?) 
        OR nis = ?`,
    [identifier, identifier, identifier]
  );
  return rows[0] || null;
}

async function create(user) {
  const {
    id,
    fullName,
    username,
    email,
    telepon,
    password,
    nis,
    gender,
    tahunMasuk = null,
    role = 'user',
    status = 'active',
    profilePicture = null,
    createdAt,
  } = user;

  await query(
    `INSERT INTO users 
     (id, full_name, username, email, phone, password, nis, gender, tahun_masuk, role, status, profile_picture, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      fullName,
      username,
      email,
      telepon,
      password,
      nis,
      gender,
      tahunMasuk,
      role,
      status,
      profilePicture,
      createdAt,
    ]
  );
  return { ...user };
}

async function update(id, fields) {
  const allowed = ['fullName', 'username', 'email', 'telepon', 'password', 'nis', 'gender', 'tahunMasuk', 'role', 'status', 'profilePicture'];
  const entries = Object.entries(fields).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return getById(id);

  const columnMap = {
    fullName: 'full_name',
    username: 'username',
    email: 'email',
    telepon: 'phone',
    password: 'password',
    nis: 'nis',
    gender: 'gender',
    tahunMasuk: 'tahun_masuk',
    role: 'role',
    status: 'status',
    profilePicture: 'profile_picture',
  };

  const setClause = entries.map(([key]) => `${columnMap[key]} = ?`).join(', ');
  const params = entries.map(([, value]) => value);
  params.push(id);

  await query(`UPDATE users SET ${setClause} WHERE id = ?`, params);
  return getById(id);
}

async function remove(id) {
  await query('DELETE FROM users WHERE id = ?', [id]);
}

async function existsWithEmailUsernameNis({ email, username, nis }, excludeId = null) {
  const rows = await query(
    `SELECT id FROM users 
     WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) OR nis = ?)
     ${excludeId ? 'AND id <> ?' : ''}`,
    excludeId ? [email, username, nis, excludeId] : [email, username, nis]
  );
  return rows.length > 0;
}

async function getNextId() {
  // Ambil angka terbesar dari kolom id dengan format U###
  const rows = await query(
    "SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) AS maxNum FROM users",
    []
  );
  const maxNum = rows[0]?.maxNum || 0;
  const nextNum = maxNum + 1;
  return `U${String(nextNum).padStart(3, "0")}`;
}

module.exports = {
  getAll,
  getById,
  findByIdentifier,
  create,
  update,
  remove,
  existsWithEmailUsernameNis,
  getNextId,
};


