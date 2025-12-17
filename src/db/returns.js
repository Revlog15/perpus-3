const { query } = require('./index');

async function list({ userId } = {}) {
  const params = [];
  let sql =
    'SELECT id, id_buku AS idBuku, id_user AS idUser, nama, tanggal_pinjam AS tanggalPinjam, tanggal_kembali AS tanggalKembali, tanggal_pengembalian AS tanggalPengembalian, status, kondisi_buku AS kondisiBuku, catatan FROM returns';
  if (userId) {
    sql += ' WHERE id_user = ?';
    params.push(userId);
  }
  return query(sql, params);
}

async function create(returnRecord) {
  const {
    id,
    idBuku,
    idUser,
    nama,
    tanggalPinjam,
    tanggalKembali,
    tanggalPengembalian,
    status,
    kondisiBuku = null,
    catatan = null,
  } = returnRecord;

  await query(
    `INSERT INTO returns 
     (id, id_buku, id_user, nama, tanggal_pinjam, tanggal_kembali, tanggal_pengembalian, status, kondisi_buku, catatan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      idBuku,
      idUser,
      nama,
      tanggalPinjam,
      tanggalKembali,
      tanggalPengembalian,
      status,
      kondisiBuku,
      catatan,
    ]
  );
  return { ...returnRecord };
}

async function markFinePaid(id, paymentId) {
  // Kolom finePaid/paymentId tidak ada di skema saat ini, jadi fungsi ini jadi no-op
  const rows = await query(
    'SELECT id, id_buku AS idBuku, id_user AS idUser, nama, tanggal_pinjam AS tanggalPinjam, tanggal_kembali AS tanggalKembali, tanggal_pengembalian AS tanggalPengembalian, status, kondisi_buku AS kondisiBuku, catatan FROM returns WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  list,
  create,
  markFinePaid,
};


