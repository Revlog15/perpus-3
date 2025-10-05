const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));

// Database (books data)
// Database (books data) — load from external JSON file
const fs = require('fs');
const booksJsonPath = path.join(__dirname, 'data_buku.json');
let books = [];

try {
  const raw = fs.readFileSync(booksJsonPath, 'utf8');
  books = JSON.parse(raw);
} catch (err) {
  console.error(`Failed to read or parse data_buku.json: ${err.message}`);
  books = [];
}

// Persistence helper: atomic save
function saveBooksSync() {
  const tmpPath = booksJsonPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(books, null, 2), 'utf8');
    fs.renameSync(tmpPath, booksJsonPath);
    // console.log('data_buku.json updated');
  } catch (err) {
    console.error('Failed to save data_buku.json:', err);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore */ }
    }
  }
}

// --- simple user storage for login/register (data_login.js) ---
const usersJsonPath = path.join(__dirname, 'data_login.js');
let authUsers = [];
try {
  const rawU = fs.readFileSync(usersJsonPath, 'utf8');
  authUsers = JSON.parse(rawU);
} catch (err) {
  console.error(`Failed to read data_login.js: ${err.message}`);
  authUsers = [];
}

function saveUsersSync() {
  const tmpPath = usersJsonPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(authUsers, null, 2), 'utf8');
    fs.renameSync(tmpPath, usersJsonPath);
  } catch (err) {
    console.error('Failed to save data_login.js:', err);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) { }
    }
  }
}

// Serve login page as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login_register.html'));
});

// Handle login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Email dan password harus diisi');

  const found = authUsers.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  if (found) {
    return res.json({ message: 'Login berhasil', role: found.role || 'user', name: found.name, id: found.id, email: found.email });
  }
  return res.status(401).json({ message: 'Gagal login' });
});

// Handle register
app.post('/register', (req, res) => {
  const { name, gender, phone, email, password, confirmPassword } = req.body;
  if (!name || !phone || !email || !password || !confirmPassword) return res.status(400).send('Semua field harus diisi');
  if (password !== confirmPassword) return res.status(400).send('Konfirmasi password tidak cocok');

  const existing = authUsers.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) return res.status(400).send('Email sudah terdaftar');

  const newUser = { id: `U${String(authUsers.length + 1).padStart(3, '0')}`, name, gender, phone, email, password, role: 'user' };
  authUsers.push(newUser);
  try { saveUsersSync(); } catch (e) { /* logged */ }
  return res.send('Registrasi berhasil');
});

// User data (simulated)
const user = {
  nama: "Andiva",
  bukuDipinjam: 2,
  denda: 5000,
  jatuhTempo: "Matematika Lanjut",
  hariJatuhTempo: 3
};

// Dummy users data
const users = [
  {
    id: "U001",
    nama: "Andiva",
    email: "andiva@email.com",
    telepon: "081234567890"
  },
  {
    id: "U002", 
    nama: "Budi Santoso",
    email: "budi@email.com",
    telepon: "081234567891"
  },
  {
    id: "U003",
    nama: "Siti Nurhaliza", 
    email: "siti@email.com",
    telepon: "081234567892"
  }
];
// Loans and returns are loaded from pinjam_buku.js
const { loans, returns } = require('./pinjam_buku');

// Routes
// root serves login_register.html earlier; user/admin routes below

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Get all books
app.get('/api/books', (req, res) => {
  res.json(books);
});

// Get available books (stok > 0)
app.get('/api/books/available', (req, res) => {
  const availableBooks = books.filter(book => book.stok > 0);
  res.json(availableBooks);
});

// Get latest books (tahun terbit >= 2015)
app.get('/api/books/latest', (req, res) => {
  const latestBooks = books.filter(book => book.tahunTerbit >= 2015);
  res.json(latestBooks);
});

// Search books
app.get('/api/books/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json(books);
  }
  
  const searchResults = books.filter(book => 
    book.namaBuku.toLowerCase().includes(q.toLowerCase()) ||
    book.penulis.toLowerCase().includes(q.toLowerCase()) ||
    book.penerbit.toLowerCase().includes(q.toLowerCase()) ||
    book.idBuku.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json(searchResults);
});

// Get popular books (top 6 with lowest remaining stock > 0)
app.get('/api/books/popular', (req, res) => {
  const popularBooks = books
    .filter(book => book.stok > 0)
    .slice() // copy before sorting to avoid mutating main list
    .sort((a, b) => a.stok - b.stok)
    .slice(0, 6);
  res.json(popularBooks);
});

// Get user info
app.get('/api/user', (req, res) => {
  res.json(user);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Get all loans
app.get('/api/loans', (req, res) => {
  res.json(loans);
});

// Create new loan
app.post('/api/loans', (req, res) => {
  const { idBuku, nama, idUser } = req.body;
  
  // Validasi input
  if (!idBuku || !nama) {
    return res.status(400).json({ message: 'ID Buku dan Nama harus diisi' });
  }
  
  // Cari buku
  const book = books.find(b => b.idBuku === idBuku);
  if (!book) {
    return res.status(404).json({ message: 'Buku tidak ditemukan' });
  }
  
  // Cek stok
  if (book.stok <= 0) {
    return res.status(400).json({ message: 'Buku tidak tersedia (stok habis)' });
  }
  
  // Determine user by idUser (preferred) or by nama
  let user = null;
  if (idUser) {
    user = users.find(u => u.id === idUser) || authUsers.find(u => u.id === idUser) || null;
    if (user && user.name) {
      // normalize user object shape
      user = { id: user.id, nama: user.name, email: user.email || '' };
    }
  }
  if (!user && nama) {
    user = users.find(u => u.nama.toLowerCase() === nama.toLowerCase());
  }
  if (!user && nama) {
    // Buat user baru dengan ID unik (fallback)
    const newUserId = `U${String(users.length + 1).padStart(3, '0')}`;
    user = {
      id: newUserId,
      nama: nama,
      email: `${nama.toLowerCase().replace(/\s+/g, '')}@email.com`,
      telepon: "000000000000"
    };
    users.push(user);
  }
  
  // Cek apakah user sudah meminjam buku yang sama
  const existingLoan = loans.find(l => l.idBuku === idBuku && l.idUser === user.id && l.status === 'aktif');
  if (existingLoan) {
    return res.status(400).json({ message: 'Anda sudah meminjam buku ini' });
  }
  
  // Buat peminjaman baru
  const today = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 7); // 7 hari dari sekarang
  
  const newLoan = {
    id: `L${String(loans.length + 1).padStart(3, '0')}`,
    idBuku: idBuku,
    idUser: user.id,
    nama: user.nama,
    tanggalPinjam: today,
    tanggalKembali: returnDate.toISOString().split('T')[0],
    status: 'aktif',
    terlambat: false
  };
  
  loans.push(newLoan);
  
  // Kurangi stok buku
  book.stok -= 1;
  // Persist book changes
  try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  
  // Update user data
  user.bukuDipinjam = loans.filter(l => l.idUser === user.id && l.status === 'aktif').length;
  
  res.status(201).json({ 
    message: 'Buku berhasil dipinjam', 
    loan: newLoan 
  });
});

// Get all returns
app.get('/api/returns', (req, res) => {
  res.json(returns);
});

// Create new return
app.post('/api/returns', (req, res) => {
  const { idBuku, nama } = req.body;
  
  // Validasi input
  if (!idBuku || !nama) {
    return res.status(400).json({ message: 'ID Buku dan Nama harus diisi' });
  }
  
  // Cari user atau buat user baru jika tidak ada
  let user = users.find(u => u.nama.toLowerCase() === nama.toLowerCase());
  if (!user) {
    // Buat user baru dengan ID unik
    const newUserId = `U${String(users.length + 1).padStart(3, '0')}`;
    user = {
      id: newUserId,
      nama: nama,
      email: `${nama.toLowerCase().replace(/\s+/g, '')}@email.com`,
      telepon: "000000000000"
    };
    users.push(user);
  }
  
  // Cari peminjaman aktif
  const activeLoan = loans.find(l => l.idBuku === idBuku && l.idUser === user.id && l.status === 'aktif');
  if (!activeLoan) {
    return res.status(404).json({ message: 'Tidak ada peminjaman aktif untuk buku ini' });
  }
  
  // Hitung denda
  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const denda = daysLate * 1000; // Rp 1000 per hari terlambat
  
  // Buat record pengembalian
  const newReturn = {
    id: `R${String(returns.length + 1).padStart(3, '0')}`,
    idBuku: idBuku,
    idUser: user.id,
    nama: user.nama,
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda: denda,
    status: 'selesai'
  };
  
  returns.push(newReturn);
  
  // Update status peminjaman
  activeLoan.status = 'dikembalikan';
  
  // Tambah stok buku
  const book = books.find(b => b.idBuku === idBuku);
  if (book) {
    book.stok += 1;
    try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  }
  
  // Update user data
  user.bukuDipinjam = loans.filter(l => l.idUser === user.id && l.status === 'aktif').length;
  user.denda = denda;
  
  res.status(201).json({ 
    message: 'Buku berhasil dikembalikan', 
    return: newReturn 
  });
});

// Get loan history for user
app.get('/api/loans/history/:userId', (req, res) => {
  const { userId } = req.params;
  const userLoans = loans.filter(l => l.idUser === userId);
  const userReturns = returns.filter(r => r.idUser === userId);
  
  res.json({
    activeLoans: userLoans.filter(l => l.status === 'aktif'),
    returnHistory: userReturns
  });
});

// Admin routes
// Add new book
app.post('/api/books', (req, res) => {
  const { idBuku, namaBuku, penulis, penerbit, tahunTerbit, stok } = req.body;
  
  // Validasi input
  if (!idBuku || !namaBuku || !penulis || !penerbit || !tahunTerbit || stok === undefined) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  
  // Cek apakah ID buku sudah ada
  const existingBook = books.find(b => b.idBuku === idBuku);
  if (existingBook) {
    return res.status(400).json({ message: 'ID buku sudah ada' });
  }
  
  // Tambah buku baru
  const newBook = {
    idBuku,
    namaBuku,
    penulis,
    penerbit,
    tahunTerbit: parseInt(tahunTerbit),
    stok: parseInt(stok)
  };
  
  books.push(newBook);
  try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  res.status(201).json({ message: 'Buku berhasil ditambahkan', book: newBook });
});

// Update book
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { namaBuku, penulis, penerbit, tahunTerbit, stok } = req.body;
  
  const bookIndex = books.findIndex(b => b.idBuku === id);
  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Buku tidak ditemukan' });
  }
  
  // Update buku
  books[bookIndex] = {
    ...books[bookIndex],
    namaBuku,
    penulis,
    penerbit,
    tahunTerbit: parseInt(tahunTerbit),
    stok: parseInt(stok)
  };
  try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  
  res.json({ message: 'Buku berhasil diupdate', book: books[bookIndex] });
});

// Delete book
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  
  const bookIndex = books.findIndex(b => b.idBuku === id);
  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Buku tidak ditemukan' });
  }
  
  // Cek apakah buku sedang dipinjam
  const activeLoan = loans.find(l => l.idBuku === id && l.status === 'aktif');
  if (activeLoan) {
    return res.status(400).json({ message: 'Buku sedang dipinjam, tidak dapat dihapus' });
  }
  
  books.splice(bookIndex, 1);
  try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  res.json({ message: 'Buku berhasil dihapus' });
});

// Get admin statistics
app.get('/api/admin/stats', (req, res) => {
  const today = new Date();
  const overdueLoans = loans.filter(loan => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === 'aktif';
  });
  
  res.json({
    totalBooks: books.length,
    totalUsers: users.length,
    activeLoans: loans.length,
    overdueLoans: overdueLoans.length,
    totalReturns: returns.length
  });
});

// Get overdue loans
app.get('/api/admin/overdue', (req, res) => {
  const today = new Date();
  const overdueLoans = loans.filter(loan => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === 'aktif';
  });
  
  res.json(overdueLoans);
});

// User management routes
// Add new user
app.post('/api/users', (req, res) => {
  const { nama, email, telepon, password } = req.body;
  
  // Validasi input
  if (!nama || !email || !telepon || !password) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  
  // Cek apakah email sudah ada
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'Email sudah digunakan' });
  }
  
  // Tambah user baru
  const newUserId = `U${String(users.length + 1).padStart(3, '0')}`;
  const newUser = {
    id: newUserId,
    nama,
    email,
    telepon,
    password, // In production, this should be hashed
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  users.push(newUser);
  res.status(201).json({ message: 'User berhasil ditambahkan', user: newUser });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { nama, email, telepon, password, status } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  
  // Cek apakah email sudah digunakan oleh user lain
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
  if (existingUser) {
    return res.status(400).json({ message: 'Email sudah digunakan' });
  }
  
  // Update user
  const updateData = { nama, email, telepon, status: status || 'active' };
  if (password) {
    updateData.password = password; // In production, this should be hashed
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...updateData
  };
  
  res.json({ message: 'User berhasil diupdate', user: users[userIndex] });
});

// Reset user password
app.post('/api/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  
  if (!password) {
    return res.status(400).json({ message: 'Password harus diisi' });
  }
  
  // Update password
  users[userIndex].password = password; // In production, this should be hashed
  
  res.json({ message: 'Password berhasil direset' });
});

// Toggle user status
app.put('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }
  
  // Update status
  users[userIndex].status = status;
  
  res.json({ message: `User berhasil ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`, user: users[userIndex] });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  
  // Check if user has active loans
  const activeLoans = loans.filter(loan => loan.idUser === id && loan.status === 'aktif');
  if (activeLoans.length > 0) {
    return res.status(400).json({ 
      message: `Tidak dapat menghapus user karena masih memiliki ${activeLoans.length} peminjaman aktif` 
    });
  }
  
  // Remove user
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({ message: 'User berhasil dihapus', user: deletedUser });
});

// Admin loan management routes
// Confirm return
app.post('/api/admin/confirm-return', (req, res) => {
  const { returnLoanId, returnBookId, returnBorrowerName, returnCondition, returnNotes } = req.body;
  
  // Validasi input
  if (!returnLoanId || !returnBookId || !returnBorrowerName) {
    return res.status(400).json({ message: 'ID Peminjaman, ID Buku, dan Nama Peminjam harus diisi' });
  }
  
  // Cari peminjaman aktif
  const activeLoan = loans.find(l => l.id === returnLoanId && l.idBuku === returnBookId && l.nama === returnBorrowerName && l.status === 'aktif');
  if (!activeLoan) {
    return res.status(404).json({ message: 'Peminjaman aktif tidak ditemukan' });
  }
  
  // Hitung denda
  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const fine = daysLate * 1000; // Rp 1000 per hari terlambat
  
  // Buat record pengembalian
  const newReturn = {
    id: `R${String(returns.length + 1).padStart(3, '0')}`,
    idBuku: returnBookId,
    idUser: activeLoan.idUser,
    nama: returnBorrowerName,
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda: fine,
    status: 'selesai',
    kondisiBuku: returnCondition || 'baik',
    catatan: returnNotes || ''
  };
  
  returns.push(newReturn);
  
  // Update status peminjaman
  activeLoan.status = 'dikembalikan';
  
  // Tambah stok buku
  const book = books.find(b => b.idBuku === returnBookId);
  if (book) {
    book.stok += 1;
    try { saveBooksSync(); } catch (e) { /* logged in saveBooksSync */ }
  }
  
  // Update user data
  const user = users.find(u => u.id === activeLoan.idUser);
  if (user) {
    user.bukuDipinjam = loans.filter(l => l.idUser === user.id && l.status === 'aktif').length;
  }
  
  res.status(201).json({ 
    message: 'Pengembalian berhasil dikonfirmasi', 
    return: newReturn,
    fine: fine
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

