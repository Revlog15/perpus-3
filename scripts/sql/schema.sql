CREATE DATABASE IF NOT EXISTS perpustakaan_sekolah;
USE perpustakaan_sekolah;

CREATE TABLE IF NOT EXISTS books (
  idBuku VARCHAR(50) PRIMARY KEY,
  namaBuku VARCHAR(255) NOT NULL,
  penulis VARCHAR(255) NOT NULL,
  penerbit VARCHAR(255) NOT NULL,
  tahunTerbit INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  kategori VARCHAR(100),
  rak VARCHAR(100),
  photo VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  fullName VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  telepon VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  nis VARCHAR(20) UNIQUE,
  gender VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  profilePicture VARCHAR(255),
  createdAt DATE
);

CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(50) PRIMARY KEY,
  idBuku VARCHAR(50),
  idUser VARCHAR(50),
  nama VARCHAR(255),
  tanggalPinjam DATE,
  tanggalKembali DATE,
  status VARCHAR(50),
  terlambat BOOLEAN DEFAULT FALSE,
  finePaid BOOLEAN DEFAULT FALSE,
  paymentId VARCHAR(50),
  FOREIGN KEY (idBuku) REFERENCES books(idBuku),
  FOREIGN KEY (idUser) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(50) PRIMARY KEY,
  idBuku VARCHAR(50),
  idUser VARCHAR(50),
  nama VARCHAR(255),
  tanggalPinjam DATE,
  tanggalKembali DATE,
  tanggalPengembalian DATE,
  denda INT DEFAULT 0,
  status VARCHAR(50),
  finePaid BOOLEAN DEFAULT FALSE,
  paymentId VARCHAR(50),
  kondisiBuku VARCHAR(100),
  catatan TEXT,
  FOREIGN KEY (idBuku) REFERENCES books(idBuku),
  FOREIGN KEY (idUser) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  returnId VARCHAR(50),
  loanId VARCHAR(50),
  idUser VARCHAR(50),
  nama VARCHAR(255),
  amount INT NOT NULL,
  paymentMethod VARCHAR(50) DEFAULT 'cash',
  tanggalBayar DATE,
  status VARCHAR(50),
  type VARCHAR(50),
  FOREIGN KEY (returnId) REFERENCES returns(id),
  FOREIGN KEY (loanId) REFERENCES loans(id),
  FOREIGN KEY (idUser) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  libraryName VARCHAR(255) DEFAULT 'NesPus',
  maxLoanDays INT DEFAULT 7,
  finePerDay INT DEFAULT 1000,
  maxBooksPerUser INT DEFAULT 5,
  autoRenewal VARCHAR(50) DEFAULT 'disabled',
  notificationDays INT DEFAULT 2
);

INSERT INTO settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = 1;



