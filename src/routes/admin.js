const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/stats', (req, res) => {
  const today = new Date();
  const overdueLoans = store.loans.filter(loan => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === 'aktif';
  });
  res.json({
    totalBooks: store.books.length,
    totalUsers: store.users.length,
    activeLoans: store.loans.filter(l => l.status === 'aktif').length,
    overdueLoans: overdueLoans.length,
    totalReturns: store.returns.length,
  });
});

router.get('/overdue', (req, res) => {
  const today = new Date();
  const overdueLoans = store.loans.filter(loan => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === 'aktif';
  });
  res.json(overdueLoans);
});

router.post('/confirm-return', (req, res) => {
  const { returnLoanId, returnBookId, returnBorrowerName, returnCondition, returnNotes } = req.body;
  if (!returnLoanId || !returnBookId || !returnBorrowerName) {
    return res.status(400).json({ message: 'ID Peminjaman, ID Buku, dan Nama Peminjam harus diisi' });
  }
  const activeLoan = store.loans.find(l => l.id === returnLoanId && l.idBuku === returnBookId && l.nama === returnBorrowerName && l.status === 'aktif');
  if (!activeLoan) return res.status(404).json({ message: 'Peminjaman aktif tidak ditemukan' });
  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const fine = daysLate * 1000;
  const newReturn = {
    id: `R${String(store.returns.length + 1).padStart(3, '0')}`,
    idBuku: returnBookId,
    idUser: activeLoan.idUser,
    nama: returnBorrowerName,
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda: fine,
    status: 'selesai',
    kondisiBuku: returnCondition || 'baik',
    catatan: returnNotes || '',
  };
  store.returns.push(newReturn);
  activeLoan.status = 'dikembalikan';
  const book = store.books.find(b => b.idBuku === returnBookId);
  if (book) {
    book.stok += 1;
    try { store.saveBooks(); } catch (_) {}
  }
  try { store.saveLoans(); } catch (_) {}
  try { store.saveReturns(); } catch (_) {}
  res.status(201).json({ message: 'Pengembalian berhasil dikonfirmasi', return: newReturn, fine });
});

module.exports = router;


