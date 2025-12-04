const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  const { userId } = req.query;
  let data = store.returns;
  if (userId) data = data.filter(r => r.idUser === userId);
  res.json(data);
});

router.post('/', (req, res) => {
  const { idBuku, idUser, adminUserId } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });
  
  // Check if request is from admin (adminUserId should be provided and user should be admin)
  // In production, this should use proper authentication middleware
  if (adminUserId) {
    const adminUser = store.users.find(u => u.id === adminUserId);
    if (!adminUser || (adminUser.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat melakukan pengembalian' });
    }
  } else {
    // If no adminUserId provided, reject the request
    // This ensures only admin can process returns
    return res.status(403).json({ message: 'Hanya admin yang dapat melakukan pengembalian. Silakan hubungi perpustakawan.' });
  }
  
  const user = store.users.find(u => u.id === idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const activeLoan = store.loans.find(l => l.idBuku === idBuku && l.idUser === idUser && l.status === 'aktif');
  if (!activeLoan) return res.status(404).json({ message: 'Tidak ada peminjaman aktif untuk buku ini' });
  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const settings = store.settings || {};
  const finePerDay = settings.finePerDay || 1000;
  const denda = daysLate * finePerDay;
  const newReturn = {
    id: `R${String(store.returns.length + 1).padStart(3, '0')}`,
    idBuku,
    idUser,
    nama: user.username || user.nama || '',
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda,
    status: 'selesai',
  };
  store.returns.push(newReturn);
  activeLoan.status = 'dikembalikan';
  const book = store.books.find(b => b.idBuku === idBuku);
  if (book) {
    book.stok += 1;
    try { store.saveBooks(); } catch (_) {}
  }
  try { store.saveLoans(); } catch (_) {}
  try { store.saveReturns(); } catch (_) {}
  res.status(201).json({ message: 'Buku berhasil dikembalikan', return: newReturn });
});

module.exports = router;


