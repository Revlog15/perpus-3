const { query } = require('./index');

async function list({ userId, status } = {}) {
  // DB columns are snake_case, map them to camelCase for the app
  let sql =
    'SELECT id, id_buku AS idBuku, id_user AS idUser, nama, tanggal_pinjam AS tanggalPinjam, tanggal_kembali AS tanggalKembali, status, terlambat FROM loans';
  const params = [];
  const conditions = [];
  if (userId) {
    conditions.push('id_user = ?');
    params.push(userId);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  return query(sql, params);
}

async function create(loan) {
  const {
    id,
    idBuku,
    idUser,
    nama,
    tanggalPinjam,
    tanggalKembali,
    status = 'aktif',
    terlambat = false,
  } = loan;
  await query(
    `INSERT INTO loans (id, id_buku, id_user, nama, tanggal_pinjam, tanggal_kembali, status, terlambat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, idBuku, idUser, nama, tanggalPinjam, tanggalKembali, status, terlambat ? 1 : 0]
  );
  return { ...loan };
}

async function getById(id) {
  const rows = await query(
    'SELECT id, id_buku AS idBuku, id_user AS idUser, nama, tanggal_pinjam AS tanggalPinjam, tanggal_kembali AS tanggalKembali, status, terlambat FROM loans WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function setStatus(id, status) {
  await query('UPDATE loans SET status = ? WHERE id = ?', [status, id]);
  return getById(id);
}

async function markFinePaid(id, paymentId) {
  // Kolom finePaid/paymentId tidak ada di skema saat ini, jadi fungsi ini jadi no-op
  // Dibiarkan ada supaya pemanggil tidak error.
  return getById(id);
}

async function countActiveByUser(idUser) {
  const rows = await query('SELECT COUNT(*) AS cnt FROM loans WHERE id_user = ? AND status = "aktif"', [idUser]);
  return rows[0]?.cnt || 0;
}

module.exports = {
  list,
  create,
  getById,
  setStatus,
  markFinePaid,
  countActiveByUser,
};


