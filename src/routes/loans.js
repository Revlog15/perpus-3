const express = require('express');
const loansRepo = require('../db/loans');
const booksRepo = require('../db/books');
const usersRepo = require('../db/users');
const settingsRepo = require('../db/settings');

const router = express.Router();

router.get('/', async (req, res) => {
  const { userId, status } = req.query;
  const loans = await loansRepo.list({ userId, status });
  res.json(loans);
});

router.post('/', async (req, res) => {
  const { idBuku, idUser, maxLoanDays, adminUserId } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });
  
  if (adminUserId) {
    const adminUser = await usersRepo.getById(adminUserId);
    if (!adminUser || (adminUser.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat membuat peminjaman' });
    }
  } else {
    return res.status(403).json({ message: 'Hanya admin yang dapat membuat peminjaman. Silakan hubungi perpustakawan.' });
  }
  
  const user = await usersRepo.getById(idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const book = await booksRepo.getById(idBuku);
  if (!book) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  if (book.stok <= 0) return res.status(400).json({ message: 'Buku tidak tersedia (stok habis)' });

  const existingLoan = await loansRepo.list({ userId: idUser, status: 'aktif' });
  const hasSame = existingLoan.find(l => l.idBuku === idBuku);
  if (hasSame) return res.status(400).json({ message: 'Anda sudah meminjam buku ini' });
  
  const settings = await settingsRepo.get() || {};
  const maxBooksPerUser = settings.maxBooksPerUser || 5;
  if (existingLoan.length >= maxBooksPerUser) {
    return res.status(400).json({ message: `Maksimal ${maxBooksPerUser} buku per user. Anda sudah meminjam ${existingLoan.length} buku.` });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  const loanDays = maxLoanDays || settings.maxLoanDays || 7;
  returnDate.setDate(returnDate.getDate() + loanDays);

  // Generate ID baru berdasarkan ID terakhir di tabel loans (menghindari duplikasi seperti 'L001')
  const newId = await loansRepo.getNextId();

  const newLoan = {
    id: newId,
    idBuku,
    idUser,
    nama: user.username || user.fullName || '',
    tanggalPinjam: today,
    tanggalKembali: returnDate.toISOString().split('T')[0],
    status: 'aktif',
    terlambat: false,
  };
  await loansRepo.create(newLoan);
  await booksRepo.decrementStock(idBuku);
  res.status(201).json({ message: 'Buku berhasil dipinjam', loan: newLoan });
});

router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const loans = await loansRepo.list({ userId });
  const returns = await require('../db/returns').list({ userId }); // lazy import to avoid cycle
  res.json({
    activeLoans: loans.filter(l => l.status === 'aktif'),
    returnHistory: returns,
  });
});

module.exports = router;


