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
    (u.username && u.username.toLowerCase() === String(identifier).toLowerCase())
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
  const { username, gender, phone, email, password, confirmPassword } = req.body;
  if (!username || !phone || !email || !password || !confirmPassword) return res.status(400).send('Semua field harus diisi');
  if (password !== confirmPassword) return res.status(400).send('Konfirmasi password tidak cocok');
  const existing = store.users.find(u => (u.email && u.email.toLowerCase() === String(email).toLowerCase()) || (u.username && u.username.toLowerCase() === String(username).toLowerCase()));
  if (existing) return res.status(400).send('Username atau Email sudah terdaftar');
  const newUser = { id: `U${String(store.users.length + 1).padStart(3, '0')}`, username, gender, phone, email, password, role: 'user', status: 'active' };
  store.users.push(newUser);
  try { store.saveUsers(); } catch (_) {}
  return res.send('Registrasi berhasil');
});

module.exports = router;


