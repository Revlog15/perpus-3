-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 19, 2025 at 07:05 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `perpustakaan_sekolah`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id_buku` varchar(10) NOT NULL,
  `nama_buku` varchar(150) DEFAULT NULL,
  `penerbit` varchar(100) DEFAULT NULL,
  `tahun_terbit` int(11) DEFAULT NULL,
  `penulis` varchar(100) DEFAULT NULL,
  `stok` int(11) DEFAULT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `rak` varchar(10) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id_buku`, `nama_buku`, `penerbit`, `tahun_terbit`, `penulis`, `stok`, `kategori`, `rak`, `photo`) VALUES
('B001', 'Laskar Pelangi', 'Bentang Pustaka', 2005, 'Andrea Hirata', 58, 'Fiksi', 'A-01', NULL),
('B002', 'Bumi Manusia', 'Hasta Mitra', 1980, 'Pramoedya Ananta Toer', 9, 'Fiksi', 'A-02', NULL),
('B003', 'Negeri 5 Menara', 'Gramedia', 2009, 'Ahmad Fuadi', 9, 'Fiksi', 'A-03', NULL),
('B004', 'Ayat-Ayat Cinta', 'Republika', 2004, 'Habiburrahman El Shirazy', 8, 'Fiksi', 'A-04', NULL),
('B005', 'Filosofi Kopi', 'Gramedia', 2006, 'Dewi Lestari', 11, 'Fiksi', 'A-05', NULL),
('B006', 'Perahu Kertas', 'Bentang Pustaka', 2009, 'Dewi Lestari', 9, 'Fiksi', 'A-06', NULL),
('B007', 'Pulang', 'Gramedia', 2015, 'Leila S. Chudori', 6, 'Fiksi', 'A-07', NULL),
('B008', 'Orang-Orang Biasa', 'Bentang Pustaka', 2019, 'Andrea Hirata', 10, 'Fiksi', 'A-08', NULL),
('B009', 'Tentang Kamu', 'Republika', 2016, 'Tere Liye', 14, 'Fiksi', 'A-09', NULL),
('B010', 'Hujan', 'Gramedia', 2016, 'Tere Liye', 12, 'Fiksi', 'A-10', NULL),
('B011', 'Rindu', 'Republika', 2014, 'Tere Liye', 14, 'Fiksi', 'A-11', NULL),
('B012', 'Cantik Itu Luka', 'Kepustakaan Populer Gramedia', 2002, 'Eka Kurniawan', 7, 'Fiksi', 'A-12', NULL),
('B013', 'Sejarah Dunia yang Disembunyikan', 'Pustaka Al-Kautsar', 2004, 'Jonathan Black', 9, 'Pengetahuan', 'B-01', NULL),
('B014', 'Atomic Habits', 'Gramedia', 2018, 'James Clear', 20, 'Pengetahuan', 'B-02', NULL),
('B015', 'Sapiens: Riwayat Singkat Umat Manusia', 'Gramedia', 2017, 'Yuval Noah Harari', 10, 'Pengetahuan', 'B-03', NULL),
('B016', 'Homo Deus', 'Gramedia', 2018, 'Yuval Noah Harari', 8, 'Pengetahuan', 'B-04', NULL),
('B017', 'The Power of Habit', 'Gramedia', 2012, 'Charles Duhigg', 18, 'Pengetahuan', 'B-05', NULL),
('B018', 'Rich Dad Poor Dad', 'Gramedia', 2000, 'Robert T. Kiyosaki', 16, 'Pengetahuan', 'B-06', NULL),
('B019', 'Think and Grow Rich', 'Gramedia', 2010, 'Napoleon Hill', 11, 'Pengetahuan', 'B-07', NULL),
('B020', '7 Habits of Highly Effective People', 'Gramedia', 2009, 'Stephen R. Covey', 8, 'Pengetahuan', 'B-08', NULL),
('B021', 'House of Flame and Shadow', 'Bloomsbury', 2024, 'Sarah J. Maas', 8, 'Fiksi', 'C-01', NULL),
('B022', 'The Familiar', 'Flatiron Books', 2024, 'Leigh Bardugo', 13, 'Fiksi', 'C-02', NULL),
('B023', 'First Lie Wins', 'Random House', 2024, 'Ashley Elston', 11, 'Fiksi', 'A-13', NULL),
('B024', 'Bahasa Indonesia Kelas X', 'Erlangga', 2024, 'Pipit Dwi Komariah', 12, 'Pelajaran', 'D-01', NULL),
('B025', 'Bahasa Indonesia Kelas XI', 'Erlangga', 2024, 'Pipit Dwi Komariah', 12, 'Pelajaran', 'D-02', NULL),
('B026', 'Bahasa Korea A1', 'International Korean Education Foundation', 2024, 'International Korean Education Foundation', 8, 'Pelajaran', 'D-03', NULL),
('B027', 'Bahasa Korea Pre-A1', 'International Korean Education Foundation', 2024, 'International Korean Education Foundation', 8, 'Pelajaran', 'D-04', NULL),
('B028', 'Koding dan Kecerdasan Artifisial Kelas X Semester 1', 'Intan Pariwara Edukasi, PT.', 2024, 'Dhian Fendina Hapsari & Bayu Pratama', 15, 'Pelajaran', 'D-05', NULL),
('B029', 'Koding dan Kecerdasan Artifisial Kelas X Semester 2', 'Intan Pariwara Edukasi, PT.', 2024, 'Dhian Fendina Hapsari & Bayu Pratama', 15, 'Pelajaran', 'D-06', NULL),
('B030', 'Matematika Kelas XI Rumpun Bisnis & Manajemen', 'Erlangga', 2024, 'Arif Ediyanto & Maya Harsari', 10, 'Pelajaran', 'D-07', NULL),
('B031', 'Matematika Kelas XI Rumpun Teknologi', 'Erlangga', 2024, 'Arif Ediyanto & Maya Harsari', 10, 'Pelajaran', 'D-08', NULL),
('B300', 'Revlog The Manipulator', 'Gramedia', 2020, 'Revand Anrian Putra', 20, 'Pengetahuan', 'C-12', 'revlog-the-manipulator.png');

-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

CREATE TABLE `loans` (
  `id` varchar(10) NOT NULL,
  `id_buku` varchar(10) DEFAULT NULL,
  `id_user` varchar(10) DEFAULT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `tanggal_pinjam` date DEFAULT NULL,
  `tanggal_kembali` date DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `terlambat` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loans`
--

INSERT INTO `loans` (`id`, `id_buku`, `id_user`, `nama`, `tanggal_pinjam`, `tanggal_kembali`, `status`, `terlambat`) VALUES
('L001', 'B300', 'U006', 'Revlog_', '2025-12-17', '2025-12-24', 'dikembalikan', 0);

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `id` varchar(10) NOT NULL,
  `id_buku` varchar(10) DEFAULT NULL,
  `id_user` varchar(10) DEFAULT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `tanggal_pinjam` date DEFAULT NULL,
  `tanggal_kembali` date DEFAULT NULL,
  `tanggal_pengembalian` date DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `kondisi_buku` varchar(50) DEFAULT NULL,
  `catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `returns`
--

INSERT INTO `returns` (`id`, `id_buku`, `id_user`, `nama`, `tanggal_pinjam`, `tanggal_kembali`, `tanggal_pengembalian`, `status`, `kondisi_buku`, `catatan`) VALUES
('R724884', 'B300', 'U006', 'Revlog_', '2025-12-17', '2025-12-24', '2025-12-17', 'selesai', 'rusak_berat', 'Covernya Copot');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `library_name` varchar(100) DEFAULT NULL,
  `max_loan_days` int(11) DEFAULT NULL,
  `max_books_per_user` int(11) DEFAULT NULL,
  `auto_renewal` varchar(20) DEFAULT NULL,
  `notification_days` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(10) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `nis` varchar(20) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `profile_picture` longtext DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `tahun_masuk` varchar(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `nis`, `username`, `gender`, `phone`, `email`, `password`, `role`, `status`, `profile_picture`, `created_at`, `tahun_masuk`) VALUES
('U003', 'Admin Perpustakaan', '1234567890', 'admin1', 'N/A', '12346', 'admin@gmail.com', '123456', 'admin', 'active', NULL, '2025-10-13', NULL),
('U006', 'Revand Anrian Peu', '7070707070', 'Revlog_', 'Pria', '081', 'rev@study.com', 'teknologi', 'user', 'active', NULL, '2025-12-03', '2023'),
('U007', 'Vanesuy', '1231231231', 'TINO', 'Pria', '0521312300', 'yogavalentinomputras@gmail.com', '123456', 'user', 'active', NULL, '2025-12-18', '2024');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id_buku`);

--
-- Indexes for table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_buku` (`id_buku`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_buku` (`id_buku`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`id_buku`) REFERENCES `books` (`id_buku`),
  ADD CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`);

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`id_buku`) REFERENCES `books` (`id_buku`),
  ADD CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
