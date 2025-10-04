const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database (books data)
const books = [
  {
    "idBuku": "B001",
    "namaBuku": "Laskar Pelangi",
    "penerbit": "Bentang Pustaka",
    "tahunTerbit": 2005,
    "penulis": "Andrea Hirata",
    "stok": 12
  },
  {
    "idBuku": "B002",
    "namaBuku": "Bumi Manusia",
    "penerbit": "Hasta Mitra",
    "tahunTerbit": 1980,
    "penulis": "Pramoedya Ananta Toer",
    "stok": 7
  },
  {
    "idBuku": "B003",
    "namaBuku": "Negeri 5 Menara",
    "penerbit": "Gramedia",
    "tahunTerbit": 2009,
    "penulis": "Ahmad Fuadi",
    "stok": 10
  },
  {
    "idBuku": "B004",
    "namaBuku": "Ayat-Ayat Cinta",
    "penerbit": "Republika",
    "tahunTerbit": 2004,
    "penulis": "Habiburrahman El Shirazy",
    "stok": 8
  },
  {
    "idBuku": "B005",
    "namaBuku": "Filosofi Kopi",
    "penerbit": "Gramedia",
    "tahunTerbit": 2006,
    "penulis": "Dewi Lestari",
    "stok": 11
  },
  {
    "idBuku": "B006",
    "namaBuku": "Perahu Kertas",
    "penerbit": "Bentang Pustaka",
    "tahunTerbit": 2009,
    "penulis": "Dewi Lestari",
    "stok": 9
  },
  {
    "idBuku": "B007",
    "namaBuku": "Pulang",
    "penerbit": "Gramedia",
    "tahunTerbit": 2015,
    "penulis": "Leila S. Chudori",
    "stok": 6
  },
  {
    "idBuku": "B008",
    "namaBuku": "Orang-Orang Biasa",
    "penerbit": "Bentang Pustaka",
    "tahunTerbit": 2019,
    "penulis": "Andrea Hirata",
    "stok": 10
  },
  {
    "idBuku": "B009",
    "namaBuku": "Tentang Kamu",
    "penerbit": "Republika",
    "tahunTerbit": 2016,
    "penulis": "Tere Liye",
    "stok": 14
  },
  {
    "idBuku": "B010",
    "namaBuku": "Hujan",
    "penerbit": "Gramedia",
    "tahunTerbit": 2016,
    "penulis": "Tere Liye",
    "stok": 13
  },
  {
    "idBuku": "B011",
    "namaBuku": "Rindu",
    "penerbit": "Republika",
    "tahunTerbit": 2014,
    "penulis": "Tere Liye",
    "stok": 15
  },
  {
    "idBuku": "B012",
    "namaBuku": "Cantik Itu Luka",
    "penerbit": "Kepustakaan Populer Gramedia",
    "tahunTerbit": 2002,
    "penulis": "Eka Kurniawan",
    "stok": 7
  },
  {
    "idBuku": "B013",
    "namaBuku": "Sejarah Dunia yang Disembunyikan",
    "penerbit": "Pustaka Al-Kautsar",
    "tahunTerbit": 2004,
    "penulis": "Jonathan Black",
    "stok": 9
  },
  {
    "idBuku": "B014",
    "namaBuku": "Atomic Habits",
    "penerbit": "Gramedia",
    "tahunTerbit": 2018,
    "penulis": "James Clear",
    "stok": 20
  },
  {
    "idBuku": "B015",
    "namaBuku": "Sapiens: Riwayat Singkat Umat Manusia",
    "penerbit": "Gramedia",
    "tahunTerbit": 2017,
    "penulis": "Yuval Noah Harari",
    "stok": 10
  },
  {
    "idBuku": "B016",
    "namaBuku": "Homo Deus",
    "penerbit": "Gramedia",
    "tahunTerbit": 2018,
    "penulis": "Yuval Noah Harari",
    "stok": 8
  },
  {
    "idBuku": "B017",
    "namaBuku": "The Power of Habit",
    "penerbit": "Gramedia",
    "tahunTerbit": 2012,
    "penulis": "Charles Duhigg",
    "stok": 18
  },
  {
    "idBuku": "B018",
    "namaBuku": "Rich Dad Poor Dad",
    "penerbit": "Gramedia",
    "tahunTerbit": 2000,
    "penulis": "Robert T. Kiyosaki",
    "stok": 16
  },
  {
    "idBuku": "B019",
    "namaBuku": "Think and Grow Rich",
    "penerbit": "Gramedia",
    "tahunTerbit": 2010,
    "penulis": "Napoleon Hill",
    "stok": 12
  },
  {
    "idBuku": "B020",
    "namaBuku": "7 Habits of Highly Effective People",
    "penerbit": "Gramedia",
    "tahunTerbit": 2009,
    "penulis": "Stephen R. Covey",
    "stok": 11
  }
];

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

// Loans data (peminjaman aktif)
let loans = [
  {
    id: "L001",
    idBuku: "B001",
    idUser: "U001",
    nama: "Andiva",
    tanggalPinjam: "2024-01-15",
    tanggalKembali: "2024-01-22",
    status: "aktif",
    terlambat: false
  },
  {
    id: "L002", 
    idBuku: "B014",
    idUser: "U001",
    nama: "Andiva",
    tanggalPinjam: "2024-01-20",
    tanggalKembali: "2024-01-27",
    status: "aktif",
    terlambat: false
  }
];

// Returns data (riwayat pengembalian)
let returns = [
  {
    id: "R001",
    idBuku: "B002",
    idUser: "U001", 
    nama: "Andiva",
    tanggalPinjam: "2024-01-01",
    tanggalKembali: "2024-01-08",
    tanggalPengembalian: "2024-01-08",
    denda: 0,
    status: "selesai"
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
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
  const { idBuku, nama } = req.body;
  
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
  
  // Cari user
  const user = users.find(u => u.nama.toLowerCase() === nama.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
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
  
  // Cari user
  const user = users.find(u => u.nama.toLowerCase() === nama.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

