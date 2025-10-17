const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const store = require('../store');

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

router.get('/', (req, res) => {
  res.json(store.books);
});

router.get('/available', (req, res) => {
  const available = store.books.filter(b => b.stok > 0);
  res.json(available);
});

router.get('/latest', (req, res) => {
  const currentYear = new Date().getFullYear();
  const cutoff = currentYear - 1;
  const latest = store.books.filter(b => Number(b.tahunTerbit) >= cutoff);
  res.json(latest);
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(store.books);
  const lower = String(q).toLowerCase();
  const results = store.books.filter(b =>
    (b.namaBuku || '').toLowerCase().includes(lower) ||
    (b.penulis || '').toLowerCase().includes(lower) ||
    (b.penerbit || '').toLowerCase().includes(lower) ||
    (b.idBuku || '').toLowerCase().includes(lower)
  );
  res.json(results);
});

router.get('/popular', (req, res) => {
  const popular = store.books
    .filter(b => b.stok > 0)
    .slice()
    .sort((a, b) => a.stok - b.stok)
    .slice(0, 6);
  res.json(popular);
});

// Admin book management
// Create book (supports multipart with optional photo upload)
router.post('/', upload.single('photo'), (req, res) => {
  try {
    const { idBuku, namaBuku, penulis, penerbit } = req.body || {};
    const tahunTerbit = req.body?.tahunTerbit;
    const stok = req.body?.stok;

    if (!idBuku || !namaBuku || !penulis || !penerbit || tahunTerbit === undefined || stok === undefined) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const exists = store.books.find(b => b.idBuku === idBuku);
    if (exists) return res.status(400).json({ message: 'ID buku sudah ada' });

    // Prepare new book object
    const newBook = {
      idBuku,
      namaBuku,
      penulis,
      penerbit,
      tahunTerbit: parseInt(tahunTerbit),
      stok: parseInt(stok),
    };

    // If photo uploaded, ensure file name matches sanitized title and keep extension
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
          // Rename/move to desired file name
          fs.renameSync(currentPath, desiredPath);
        }
        newBook.photo = desiredName; // store filename for admin view if needed
      } catch (err) {
        console.error('Failed to finalize uploaded photo name:', err.message);
      }
    }

    store.books.push(newBook);
    try { store.saveBooks(); } catch (_) {}
    return res.status(201).json({ message: 'Buku berhasil ditambahkan', book: newBook });
  } catch (err) {
    console.error('Failed to add book:', err);
    return res.status(500).json({ message: 'Gagal menambahkan buku' });
  }
});

router.put('/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { namaBuku, penulis, penerbit, tahunTerbit, stok } = req.body;
  const idx = store.books.findIndex(b => b.idBuku === id);
  if (idx === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  const current = store.books[idx];
  const updated = { ...current };
  if (namaBuku !== undefined) updated.namaBuku = namaBuku;
  if (penulis !== undefined) updated.penulis = penulis;
  if (penerbit !== undefined) updated.penerbit = penerbit;
  if (tahunTerbit !== undefined) updated.tahunTerbit = parseInt(tahunTerbit);
  if (stok !== undefined) updated.stok = parseInt(stok);

  // If new photo is uploaded, rename and store filename
  if (req.file) {
    const sanitize = (str) => String(str || '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
    const imagesDir = path.join(__dirname, '../../images');
    const ext = path.extname(req.file.originalname) || '.jpg';
    const desiredName = sanitize(namaBuku || updated.namaBuku) + ext;
    const currentPath = req.file.path;
    const desiredPath = path.join(imagesDir, desiredName);
    try {
      if (path.basename(currentPath) !== desiredName) {
        fs.renameSync(currentPath, desiredPath);
      }
      updated.photo = desiredName;
    } catch (err) {
      console.error('Failed to finalize uploaded photo name (update):', err.message);
    }
  }

  store.books[idx] = updated;
  try { store.saveBooks(); } catch (_) {}
  res.json({ message: 'Buku berhasil diupdate', book: store.books[idx] });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.books.findIndex(b => b.idBuku === id);
  if (idx === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  const activeLoan = store.loans.find(l => l.idBuku === id && l.status === 'aktif');
  if (activeLoan) return res.status(400).json({ message: 'Buku sedang dipinjam, tidak dapat dihapus' });
  store.books.splice(idx, 1);
  try { store.saveBooks(); } catch (_) {}
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


