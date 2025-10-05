const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  const normalized = (store.users || []).map(u => ({
    ...u,
    nama: u.nama || u.username || '',
    telepon: u.telepon || u.phone || '',
    status: u.status || 'active',
    createdAt: u.createdAt || '',
  }));
  res.json(normalized);
});

router.post('/', (req, res) => {
  const { nama, email, telepon, password } = req.body;
  if (!nama || !email || !telepon || !password) return res.status(400).json({ message: 'Semua field harus diisi' });
  const existingUser = store.users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
  if (existingUser) return res.status(400).json({ message: 'Email sudah digunakan' });
  const newUserId = `U${String(store.users.length + 1).padStart(3, '0')}`;
  const newUser = { id: newUserId, nama, email, telepon, password, status: 'active', createdAt: new Date().toISOString().split('T')[0] };
  store.users.push(newUser);
  try { store.saveUsers(); } catch (_) {}
  res.status(201).json({ message: 'User berhasil ditambahkan', user: newUser });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nama, email, telepon, password, status } = req.body;
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User tidak ditemukan' });
  const exists = store.users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase() && u.id !== id);
  if (exists) return res.status(400).json({ message: 'Email sudah digunakan' });
  const updateData = { nama, email, telepon, status: status || 'active' };
  if (password) updateData.password = password;
  store.users[idx] = { ...store.users[idx], ...updateData };
  try { store.saveUsers(); } catch (_) {}
  res.json({ message: 'User berhasil diupdate', user: store.users[idx] });
});

router.post('/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User tidak ditemukan' });
  if (!password) return res.status(400).json({ message: 'Password harus diisi' });
  store.users[idx].password = password;
  try { store.saveUsers(); } catch (_) {}
  res.json({ message: 'Password berhasil direset' });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User tidak ditemukan' });
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  store.users[idx].status = status;
  try { store.saveUsers(); } catch (_) {}
  res.json({ message: `User berhasil ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`, user: store.users[idx] });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User tidak ditemukan' });
  const activeLoans = store.loans.filter(loan => loan.idUser === id && loan.status === 'aktif');
  if (activeLoans.length > 0) {
    return res.status(400).json({ message: `Tidak dapat menghapus user karena masih memiliki ${activeLoans.length} peminjaman aktif` });
  }
  const deletedUser = store.users.splice(idx, 1)[0];
  try { store.saveUsers(); } catch (_) {}
  res.json({ message: 'User berhasil dihapus', user: deletedUser });
});

module.exports = router;


