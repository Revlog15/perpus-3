const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  const { userId, status } = req.query;
  let data = store.loans;
  if (userId) data = data.filter(l => l.idUser === userId);
  if (status) data = data.filter(l => l.status === status);
  res.json(data);
});

router.post('/', (req, res) => {
  const { idBuku, idUser } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });
  const user = store.users.find(u => u.id === idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const book = store.books.find(b => b.idBuku === idBuku);
  if (!book) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  if (book.stok <= 0) return res.status(400).json({ message: 'Buku tidak tersedia (stok habis)' });
  const existingLoan = store.loans.find(l => l.idBuku === idBuku && l.idUser === idUser && l.status === 'aktif');
  if (existingLoan) return res.status(400).json({ message: 'Anda sudah meminjam buku ini' });
  const today = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 7);
  const newLoan = {
    id: `L${String(store.loans.length + 1).padStart(3, '0')}`,
    idBuku,
    idUser,
    nama: user.username || user.nama || '',
    tanggalPinjam: today,
    tanggalKembali: returnDate.toISOString().split('T')[0],
    status: 'aktif',
    terlambat: false,
  };
  store.loans.push(newLoan);
  book.stok -= 1;
  try { store.saveBooks(); } catch (_) {}
  try { store.saveLoans(); } catch (_) {}
  res.status(201).json({ message: 'Buku berhasil dipinjam', loan: newLoan });
});

router.get('/history/:userId', (req, res) => {
  const { userId } = req.params;
  const userLoans = store.loans.filter(l => l.idUser === userId);
  const userReturns = store.returns.filter(r => r.idUser === userId);
  res.json({
    activeLoans: userLoans.filter(l => l.status === 'aktif'),
    returnHistory: userReturns,
  });
});

module.exports = router;


