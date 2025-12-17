const { query, pool } = require('./index');

async function getAll() {
  return query(
    'SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak FROM books',
    []
  );
}

async function getAvailable() {
  return query(
    'SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak FROM books WHERE stok > 0',
    []
  );
}

async function getLatest(cutoffYear) {
  return query(
    'SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak FROM books WHERE tahun_terbit >= ?',
    [cutoffYear]
  );
}

async function search(term) {
  const like = `%${term}%`;
  return query(
    `SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak 
     FROM books 
     WHERE LOWER(nama_buku) LIKE LOWER(?) 
        OR LOWER(penulis) LIKE LOWER(?) 
        OR LOWER(penerbit) LIKE LOWER(?) 
        OR LOWER(id_buku) LIKE LOWER(?)`,
    [like, like, like, like]
  );
}

async function create(book) {
  const {
    idBuku,
    namaBuku,
    penulis,
    penerbit,
    tahunTerbit,
    stok,
    kategori = null,
    rak = null,
    photo = null,
  } = book;
  await query(
    `INSERT INTO books (id_buku, nama_buku, penulis, penerbit, tahun_terbit, stok, kategori, rak, photo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [idBuku, namaBuku, penulis, penerbit, tahunTerbit, stok, kategori, rak, photo]
  );
  return { ...book };
}

async function update(idBuku, fields) {
  const allowed = ['namaBuku', 'penulis', 'penerbit', 'tahunTerbit', 'stok', 'kategori', 'rak', 'photo'];
  const entries = Object.entries(fields).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return getById(idBuku);

  const columnMap = {
    namaBuku: 'nama_buku',
    penulis: 'penulis',
    penerbit: 'penerbit',
    tahunTerbit: 'tahun_terbit',
    stok: 'stok',
    kategori: 'kategori',
    rak: 'rak',
    photo: 'photo',
  };

  const setClause = entries.map(([key]) => `${columnMap[key]} = ?`).join(', ');
  const params = entries.map(([, value]) => value);
  params.push(idBuku);

  await query(`UPDATE books SET ${setClause} WHERE id_buku = ?`, params);
  return getById(idBuku);
}

async function remove(idBuku) {
  await query('DELETE FROM books WHERE id_buku = ?', [idBuku]);
}

async function getById(idBuku) {
  const rows = await query(
    'SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak FROM books WHERE id_buku = ?',
    [idBuku]
  );
  return rows[0] || null;
}

async function hasActiveLoan(idBuku) {
  const rows = await query('SELECT 1 FROM loans WHERE id_buku = ? AND status = "aktif" LIMIT 1', [idBuku]);
  return rows.length > 0;
}

async function getPopular(limit = 6) {
  return query(
    'SELECT id_buku AS idBuku, nama_buku AS namaBuku, penulis, penerbit, tahun_terbit AS tahunTerbit, stok, kategori, rak FROM books WHERE stok > 0 ORDER BY stok ASC LIMIT ?',
    [limit]
  );
}

async function decrementStock(idBuku) {
  await query('UPDATE books SET stok = stok - 1 WHERE id_buku = ? AND stok > 0', [idBuku]);
}

async function incrementStock(idBuku) {
  await query('UPDATE books SET stok = stok + 1 WHERE id_buku = ?', [idBuku]);
}

module.exports = {
  getAll,
  getAvailable,
  getLatest,
  search,
  create,
  update,
  remove,
  getById,
  hasActiveLoan,
  decrementStock,
  incrementStock,
  getPopular,
};

