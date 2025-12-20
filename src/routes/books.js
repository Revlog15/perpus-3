const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const booksRepo = require('../db/books');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../images');
    // Create images directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use the filename from the request body
    const filename = req.body.filename || file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.get('/', async (_req, res) => {
  const books = await booksRepo.getAll();
  res.json(books);
});

router.get('/available', async (_req, res) => {
  const books = await booksRepo.getAvailable();
  res.json(books);
});

router.get('/latest', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const cutoff = currentYear - 1;
  const books = await booksRepo.getLatest(cutoff);
  res.json(books);
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    const books = await booksRepo.getAll();
    return res.json(books);
  }
  const results = await booksRepo.search(String(q));
  res.json(results);
});

router.get('/popular', async (_req, res) => {
  const popular = await booksRepo.getPopular(6);
  res.json(popular);
});

// Admin book management
// Create book (supports multipart with optional photo upload)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { idBuku, namaBuku, penulis, penerbit, kategori, rak } = req.body || {};
    const tahunTerbit = req.body?.tahunTerbit;
    const stok = req.body?.stok;

    if (!idBuku || !namaBuku || !penulis || !penerbit || tahunTerbit === undefined || stok === undefined) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const exists = await booksRepo.getById(idBuku);
    if (exists) return res.status(400).json({ message: 'ID buku sudah ada' });

    const newBook = {
      idBuku,
      namaBuku,
      penulis,
      penerbit,
      tahunTerbit: parseInt(tahunTerbit, 10),
      stok: parseInt(stok, 10),
      kategori: kategori || null,
      rak: rak || null,
      photo: null,
    };

    if (req.file) {
      const sanitize = (str) => String(str || '')
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase();

      const imagesDir = path.join(__dirname, '../../images');
      const ext = path.extname(req.file.originalname) || '.jpg';
      const desiredName = sanitize(namaBuku) + ext;
      const currentPath = req.file.path;
      const desiredPath = path.join(imagesDir, desiredName);

      try {
        if (path.basename(currentPath) !== desiredName) {
          fs.renameSync(currentPath, desiredPath);
        }
        newBook.photo = desiredName;
      } catch (err) {
        console.error('Failed to finalize uploaded photo name:', err.message);
      }
    }

    await booksRepo.create(newBook);
    return res.status(201).json({ message: 'Buku berhasil ditambahkan', book: newBook });
  } catch (err) {
    console.error('Failed to add book:', err);
    return res.status(500).json({ message: 'Gagal menambahkan buku' });
  }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { namaBuku, penulis, penerbit, tahunTerbit, stok, kategori, rak } = req.body || {};
  const existing = await booksRepo.getById(id);
  if (!existing) return res.status(404).json({ message: 'Buku tidak ditemukan' });

  const fields = {};
  if (namaBuku !== undefined) fields.namaBuku = namaBuku;
  if (penulis !== undefined) fields.penulis = penulis;
  if (penerbit !== undefined) fields.penerbit = penerbit;
  if (tahunTerbit !== undefined) fields.tahunTerbit = parseInt(tahunTerbit, 10);
  if (stok !== undefined) fields.stok = parseInt(stok, 10);
  if (kategori !== undefined) fields.kategori = kategori === '' || kategori === null ? null : kategori;
  if (rak !== undefined) fields.rak = rak === '' || rak === null ? null : rak;

  if (req.file) {
    const sanitize = (str) => String(str || '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
    const imagesDir = path.join(__dirname, '../../images');
    const ext = path.extname(req.file.originalname) || '.jpg';
    const desiredName = sanitize(namaBuku || existing.namaBuku) + ext;
    const currentPath = req.file.path;
    const desiredPath = path.join(imagesDir, desiredName);
    try {
      if (path.basename(currentPath) !== desiredName) {
        fs.renameSync(currentPath, desiredPath);
      }
      fields.photo = desiredName;
    } catch (err) {
      console.error('Failed to finalize uploaded photo name (update):', err.message);
    }
  }

  const updated = await booksRepo.update(id, fields);
  res.json({ message: 'Buku berhasil diupdate', book: updated });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await booksRepo.getById(id);
  if (!existing) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  const activeLoan = await booksRepo.hasActiveLoan(id);
  if (activeLoan) {
    return res
      .status(400)
      .json({ message: 'Buku sudah pernah dipinjam, tidak dapat dihapus karena masih terhubung dengan data peminjaman.' });
  }
  await booksRepo.remove(id);
  res.json({ message: 'Buku berhasil dihapus' });
});

// Photo upload endpoint
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    res.json({ 
      message: 'Photo uploaded successfully',
      filename: req.file.filename,
      path: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Photo upload failed', error: error.message });
  }
});

module.exports = router;


