const express = require('express');
const path = require('path');
const usersRepo = require('../db/users');

const router = express.Router();

router.get('/login-page', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'login_register.html'));
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).send('Identifier dan password harus diisi');
  const found = await usersRepo.findByIdentifier(String(identifier));
  if (found && found.password === password) {
    if ((found.status || 'active') !== 'active') {
      return res.status(403).json({ message: 'Akun dinonaktifkan' });
    }
    const username = found.username || found.fullName || found.email || 'User';
    return res.json({ 
      message: 'Login berhasil', 
      role: found.role || 'user', 
      username, 
      id: found.id, 
      email: found.email,
      profilePicture: found.profilePicture || null
    });
  }
  return res.status(401).json({ message: 'Gagal login' });
});

router.post('/register', async (req, res) => {
  const { fullName, nis, tahunMasuk, username, gender, phone, email, password, confirmPassword } = req.body;
  if (!fullName || !nis || !tahunMasuk || !username || !phone || !email || !password || !confirmPassword) {
    return res.status(400).send('Semua field harus diisi');
  }
  if (!/^\d{10}$/.test(nis)) return res.status(400).send('NIS harus 10 digit angka');
  if (!/^\d{4}$/.test(String(tahunMasuk))) return res.status(400).send('Tahun masuk harus 4 digit angka');
  if (password !== confirmPassword) return res.status(400).send('Konfirmasi password tidak cocok');
  const existingUser = await usersRepo.findByIdentifier(String(email).toLowerCase()) || await usersRepo.findByIdentifier(String(username).toLowerCase()) || await usersRepo.findByIdentifier(String(nis));
  if (existingUser) {
    if (existingUser.nis === String(nis)) return res.status(400).send('NIS sudah terdaftar');
    return res.status(400).send('Username atau Email sudah terdaftar');
  }
  const newId = await usersRepo.getNextId();
  const newUser = { 
    id: newId, 
    fullName, 
    nis,
    tahunMasuk,
    username, 
    gender, 
    telepon: phone, 
    email, 
    password, 
    role: 'user', 
    status: 'active', 
    profilePicture: null, 
    createdAt: new Date().toISOString().split('T')[0] 
  };
  await usersRepo.create(newUser);
  return res.send('Registrasi berhasil');
});

router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { fullName, username, password, profilePicture, email, phone, gender, tahunMasuk } = req.body;
  
  const user = await usersRepo.getById(userId);
  if (!user) return res.status(404).send('User tidak ditemukan');
  
  const updated = await usersRepo.update(userId, {
    fullName,
    username,
    password,
    profilePicture,
    email,
    telepon: phone,
    gender,
    tahunMasuk,
  });
  
  return res.json({ message: 'Profil berhasil diperbarui', user: updated });
});

router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await usersRepo.getById(userId);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  return res.json(user);
});

module.exports = router;
