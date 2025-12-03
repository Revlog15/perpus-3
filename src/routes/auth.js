const express = require('express');
const path = require('path');
const store = require('../store');

const router = express.Router();

router.get('/login-page', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'login_register.html'));
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).send('Identifier dan password harus diisi');
  const found = store.users.find(u => (
    (u.email && u.email.toLowerCase() === String(identifier).toLowerCase()) ||
    (u.username && u.username.toLowerCase() === String(identifier).toLowerCase()) ||
    (u.nis && u.nis === String(identifier))
  ) && u.password === password);
  if (found) {
    if ((found.status || 'active') !== 'active') {
      return res.status(403).json({ message: 'Akun dinonaktifkan' });
    }
    const username = found.username || found.nama || found.email || 'User';
    return res.json({ message: 'Login berhasil', role: found.role || 'user', username, id: found.id, email: found.email });
  }
  return res.status(401).json({ message: 'Gagal login' });
});

router.post('/register', (req, res) => {
  const { fullName, nis, username, gender, phone, email, password, confirmPassword } = req.body;
  if (!fullName || !nis || !username || !phone || !email || !password || !confirmPassword) return res.status(400).send('Semua field harus diisi');
  if (!/^\d{10}$/.test(nis)) return res.status(400).send('NIS harus 10 digit angka');
  if (password !== confirmPassword) return res.status(400).send('Konfirmasi password tidak cocok');
  const existing = store.users.find(u => (u.email && u.email.toLowerCase() === String(email).toLowerCase()) || (u.username && u.username.toLowerCase() === String(username).toLowerCase()) || (u.nis && u.nis === String(nis)));
  if (existing) {
    if (existing.nis === String(nis)) return res.status(400).send('NIS sudah terdaftar');
    return res.status(400).send('Username atau Email sudah terdaftar');
  }
  const newUser = { id: `U${String(store.users.length + 1).padStart(3, '0')}`, fullName, nis, username, gender, phone, email, password, role: 'user', status: 'active', profilePicture: null, createdAt: new Date().toISOString().split('T')[0] };
  store.users.push(newUser);
  try { store.saveUsers(); } catch (_) {}
  return res.send('Registrasi berhasil');
});

router.put('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const { fullName, username, password, profilePicture, email, phone, gender } = req.body;
  
  const user = store.users.find(u => String(u.id) === String(userId));
  if (!user) return res.status(404).send('User tidak ditemukan');
  
  if (fullName) user.fullName = fullName;
  if (username) user.username = username;
  if (password) user.password = password;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;
  
  try { store.saveUsers(); } catch (_) {}
  return res.json({ message: 'Profil berhasil diperbarui', user });
});

router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const user = store.users.find(u => String(u.id) === String(userId));
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  return res.json(user);
});

module.exports = router;
