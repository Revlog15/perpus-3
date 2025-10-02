const express = require('express'); 
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database (books 
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

// Get popular books (top 6 by stock)
app.get('/api/books/popular', (req, res) => {
  const popularBooks = books
    .sort((a, b) => b.stok - a.stok)
    .slice(0, 6);
  res.json(popularBooks);
});

// Get user info
app.get('/api/user', (req, res) => {
  res.json(user);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

