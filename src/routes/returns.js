const express = require('express');
const returnsRepo = require('../db/returns');
const loansRepo = require('../db/loans');
const usersRepo = require('../db/users');
const booksRepo = require('../db/books');
const settingsRepo = require('../db/settings');

const router = express.Router();

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const data = await returnsRepo.list({ userId });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { idBuku, idUser, adminUserId } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });
  
  if (adminUserId) {
    const adminUser = await usersRepo.getById(adminUserId);
    if (!adminUser || (adminUser.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat melakukan pengembalian' });
    }
  } else {
    return res.status(403).json({ message: 'Hanya admin yang dapat melakukan pengembalian. Silakan hubungi perpustakawan.' });
  }
  
  const user = await usersRepo.getById(idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const activeLoan = (await loansRepo.list({ userId: idUser, status: 'aktif' })).find(l => l.idBuku === idBuku);
  if (!activeLoan) return res.status(404).json({ message: 'Tidak ada peminjaman aktif untuk buku ini' });

  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const settings = await settingsRepo.get() || {};
  const finePerDay = settings.finePerDay || 1000;
  const denda = daysLate * finePerDay;
  const newReturn = {
    id: `R${String(Date.now()).slice(-6)}`,
    idBuku,
    idUser,
    nama: user.username || user.fullName || '',
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda,
    status: 'selesai',
  };
  await returnsRepo.create(newReturn);
  await loansRepo.setStatus(activeLoan.id, 'dikembalikan');
  await booksRepo.incrementStock(idBuku);
  res.status(201).json({ message: 'Buku berhasil dikembalikan', return: newReturn });
});

module.exports = router;


