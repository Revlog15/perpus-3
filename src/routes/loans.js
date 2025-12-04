const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  const { userId, status } = req.query;
  let data = store.loans.map(l => ({
    ...l,
    nama: l.nama || (store.users.find(u => u.id === l.idUser)?.nama || store.users.find(u => u.id === l.idUser)?.username || ''),
  }));
  if (userId) data = data.filter(l => l.idUser === userId);
  if (status) data = data.filter(l => l.status === status);
  res.json(data);
});

router.post('/', (req, res) => {
  const { idBuku, idUser, maxLoanDays, adminUserId } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });
  
  // Check if request is from admin (adminUserId should be provided and user should be admin)
  // In production, this should use proper authentication middleware
  if (adminUserId) {
    const adminUser = store.users.find(u => u.id === adminUserId);
    if (!adminUser || (adminUser.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat membuat peminjaman' });
    }
  } else {
    // If no adminUserId provided, check if the requesting user is admin
    // This is a fallback - in production, use proper session/auth
    return res.status(403).json({ message: 'Hanya admin yang dapat membuat peminjaman. Silakan hubungi perpustakawan.' });
  }
  
  const user = store.users.find(u => u.id === idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const book = store.books.find(b => b.idBuku === idBuku);
  if (!book) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  if (book.stok <= 0) return res.status(400).json({ message: 'Buku tidak tersedia (stok habis)' });
  const existingLoan = store.loans.find(l => l.idBuku === idBuku && l.idUser === idUser && l.status === 'aktif');
  if (existingLoan) return res.status(400).json({ message: 'Anda sudah meminjam buku ini' });
  
  // Check max books per user using system settings
  const settings = store.settings || {};
  const maxBooksPerUser = settings.maxBooksPerUser || 5;
  const userActiveLoans = store.loans.filter(l => l.idUser === idUser && l.status === 'aktif');
  if (userActiveLoans.length >= maxBooksPerUser) {
    return res.status(400).json({ message: `Maksimal ${maxBooksPerUser} buku per user. Anda sudah meminjam ${userActiveLoans.length} buku.` });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  const loanDays = maxLoanDays || settings.maxLoanDays || 7;
  returnDate.setDate(returnDate.getDate() + loanDays);
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
  // hint frontends to refresh
  // (Triggered via admin/user storage listeners by setting a timestamp through client on success)
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


