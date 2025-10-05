const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(store.books);
});

router.get('/available', (req, res) => {
  const available = store.books.filter(b => b.stok > 0);
  res.json(available);
});

router.get('/latest', (req, res) => {
  const currentYear = new Date().getFullYear();
  const cutoff = currentYear - 1;
  const latest = store.books.filter(b => Number(b.tahunTerbit) >= cutoff);
  res.json(latest);
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(store.books);
  const lower = String(q).toLowerCase();
  const results = store.books.filter(b =>
    (b.namaBuku || '').toLowerCase().includes(lower) ||
    (b.penulis || '').toLowerCase().includes(lower) ||
    (b.penerbit || '').toLowerCase().includes(lower) ||
    (b.idBuku || '').toLowerCase().includes(lower)
  );
  res.json(results);
});

router.get('/popular', (req, res) => {
  const popular = store.books
    .filter(b => b.stok > 0)
    .slice()
    .sort((a, b) => a.stok - b.stok)
    .slice(0, 6);
  res.json(popular);
});

// Admin book management
router.post('/', (req, res) => {
  const { idBuku, namaBuku, penulis, penerbit, tahunTerbit, stok } = req.body;
  if (!idBuku || !namaBuku || !penulis || !penerbit || !tahunTerbit || stok === undefined) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  const exists = store.books.find(b => b.idBuku === idBuku);
  if (exists) return res.status(400).json({ message: 'ID buku sudah ada' });
  const newBook = {
    idBuku,
    namaBuku,
    penulis,
    penerbit,
    tahunTerbit: parseInt(tahunTerbit),
    stok: parseInt(stok),
  };
  store.books.push(newBook);
  try { store.saveBooks(); } catch (_) {}
  res.status(201).json({ message: 'Buku berhasil ditambahkan', book: newBook });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { namaBuku, penulis, penerbit, tahunTerbit, stok } = req.body;
  const idx = store.books.findIndex(b => b.idBuku === id);
  if (idx === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  store.books[idx] = {
    ...store.books[idx],
    namaBuku,
    penulis,
    penerbit,
    tahunTerbit: parseInt(tahunTerbit),
    stok: parseInt(stok),
  };
  try { store.saveBooks(); } catch (_) {}
  res.json({ message: 'Buku berhasil diupdate', book: store.books[idx] });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.books.findIndex(b => b.idBuku === id);
  if (idx === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  const activeLoan = store.loans.find(l => l.idBuku === id && l.status === 'aktif');
  if (activeLoan) return res.status(400).json({ message: 'Buku sedang dipinjam, tidak dapat dihapus' });
  store.books.splice(idx, 1);
  try { store.saveBooks(); } catch (_) {}
  res.json({ message: 'Buku berhasil dihapus' });
});

module.exports = router;


