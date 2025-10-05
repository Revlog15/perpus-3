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

// --- loans and returns persistent storage (JSON files) ---
const loansJsonPath = path.join(__dirname, 'data_loans.json');
const returnsJsonPath = path.join(__dirname, 'data_returns.json');
let loans = [];
let returns = [];
try {
  if (fs.existsSync(loansJsonPath)) {
    loans = JSON.parse(fs.readFileSync(loansJsonPath, 'utf8')) || [];
  }
} catch (e) {
  console.error('Failed to read data_loans.json:', e.message);
  loans = [];
}
try {
  if (fs.existsSync(returnsJsonPath)) {
    returns = JSON.parse(fs.readFileSync(returnsJsonPath, 'utf8')) || [];
  }
} catch (e) {
  console.error('Failed to read data_returns.json:', e.message);
  returns = [];
}

function saveLoansSync() {
  const tmpPath = loansJsonPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(loans, null, 2), 'utf8');
    fs.renameSync(tmpPath, loansJsonPath);
  } catch (err) {
    console.error('Failed to save data_loans.json:', err);
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) { }
    }
  }
}

function saveReturnsSync() {
  const tmpPath = returnsJsonPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(returns, null, 2), 'utf8');
    fs.renameSync(tmpPath, returnsJsonPath);
  } catch (err) {
    console.error('Failed to save data_returns.json:', err);
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
  // accept identifier which can be username or email
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).send('Identifier dan password harus diisi');

  const found = authUsers.find(u => (
    (u.email && u.email.toLowerCase() === String(identifier).toLowerCase()) ||
    (u.username && u.username.toLowerCase() === String(identifier).toLowerCase())
  ) && u.password === password);

  if (found) {
    return res.json({ message: 'Login berhasil', role: found.role || 'user', username: found.username, id: found.id, email: found.email });
  }
  return res.status(401).json({ message: 'Gagal login' });
});

// Handle register
app.post('/register', (req, res) => {
  const { username, gender, phone, email, password, confirmPassword } = req.body;
  if (!username || !phone || !email || !password || !confirmPassword) return res.status(400).send('Semua field harus diisi');
  if (password !== confirmPassword) return res.status(400).send('Konfirmasi password tidak cocok');

  const existing = authUsers.find(u => (u.email && u.email.toLowerCase() === String(email).toLowerCase()) || (u.username && u.username.toLowerCase() === String(username).toLowerCase()));
  if (existing) return res.status(400).send('Username atau Email sudah terdaftar');

  const newUser = { id: `U${String(authUsers.length + 1).padStart(3, '0')}`, username, gender, phone, email, password, role: 'user' };
  authUsers.push(newUser);
  try { saveUsersSync(); } catch (e) { /* logged */ }
  return res.send('Registrasi berhasil');
});

// Remove simulated user and dummy users. Loans/returns now persisted via JSON above.

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
  const currentYear = new Date().getFullYear();
  const cutoff = currentYear - 1; // published within last 1 year
  const latestBooks = books.filter(book => Number(book.tahunTerbit) >= cutoff);
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
  res.json(authUsers);
});

// Get all loans
app.get('/api/loans', (req, res) => {
  const { userId, status } = req.query;
  let data = loans;
  if (userId) data = data.filter(l => l.idUser === userId);
  if (status) data = data.filter(l => l.status === status);
  res.json(data);
});

// Create new loan
app.post('/api/loans', (req, res) => {
  const { idBuku, idUser } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });

  const user = authUsers.find(u => u.id === idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  const book = books.find(b => b.idBuku === idBuku);
  if (!book) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  if (book.stok <= 0) return res.status(400).json({ message: 'Buku tidak tersedia (stok habis)' });

  const existingLoan = loans.find(l => l.idBuku === idBuku && l.idUser === idUser && l.status === 'aktif');
  if (existingLoan) return res.status(400).json({ message: 'Anda sudah meminjam buku ini' });

  const today = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 7);

  const newLoan = {
    id: `L${String(loans.length + 1).padStart(3, '0')}`,
    idBuku,
    idUser,
    nama: user.username || user.nama || '',
    tanggalPinjam: today,
    tanggalKembali: returnDate.toISOString().split('T')[0],
    status: 'aktif',
    terlambat: false
  };

  loans.push(newLoan);
  book.stok -= 1;
  try { saveBooksSync(); } catch (e) { }
  try { saveLoansSync(); } catch (e) { }

  return res.status(201).json({ message: 'Buku berhasil dipinjam', loan: newLoan });
});

// Get all returns
app.get('/api/returns', (req, res) => {
  const { userId } = req.query;
  let data = returns;
  if (userId) data = data.filter(r => r.idUser === userId);
  res.json(data);
});

// Create new return
app.post('/api/returns', (req, res) => {
  const { idBuku, idUser } = req.body;
  if (!idBuku || !idUser) return res.status(400).json({ message: 'ID Buku dan ID User harus diisi' });

  const user = authUsers.find(u => u.id === idUser);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  const activeLoan = loans.find(l => l.idBuku === idBuku && l.idUser === idUser && l.status === 'aktif');
  if (!activeLoan) return res.status(404).json({ message: 'Tidak ada peminjaman aktif untuk buku ini' });

  const today = new Date();
  const returnDate = new Date(activeLoan.tanggalKembali);
  const daysLate = Math.max(0, Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)));
  const denda = daysLate * 1000;

  const newReturn = {
    id: `R${String(returns.length + 1).padStart(3, '0')}`,
    idBuku,
    idUser,
    nama: user.username || user.nama || '',
    tanggalPinjam: activeLoan.tanggalPinjam,
    tanggalKembali: activeLoan.tanggalKembali,
    tanggalPengembalian: today.toISOString().split('T')[0],
    denda,
    status: 'selesai'
  };

  returns.push(newReturn);
  activeLoan.status = 'dikembalikan';

  const book = books.find(b => b.idBuku === idBuku);
  if (book) {
    book.stok += 1;
    try { saveBooksSync(); } catch (e) { }
  }
  try { saveLoansSync(); } catch (e) { }
  try { saveReturnsSync(); } catch (e) { }

  return res.status(201).json({ message: 'Buku berhasil dikembalikan', return: newReturn });
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
    totalUsers: authUsers.length,
    activeLoans: loans.filter(l => l.status === 'aktif').length,
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
  
  try { saveLoansSync(); } catch (e) { }
  try { saveReturnsSync(); } catch (e) { }
  
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

