const express = require("express");
const loansRepo = require("../db/loans");
const booksRepo = require("../db/books");
const usersRepo = require("../db/users");
const returnsRepo = require("../db/returns");
const settingsRepo = require("../db/settings");

const router = express.Router();

router.get("/stats", (req, res) => {
  (async () => {
    const today = new Date();
    const loans = await loansRepo.list();
    const books = await booksRepo.getAll();
    const users = await usersRepo.getAll();
    const returns = await returnsRepo.list();

    const overdueLoans = loans.filter((loan) => {
      const returnDate = new Date(loan.tanggalKembali);
      return returnDate < today && loan.status === "aktif";
    });
    res.json({
      totalBooks: books.length,
      totalUsers: users.filter(
        (u) => String(u.role || "").toLowerCase() !== "admin"
      ).length,
      activeLoans: loans.filter((l) => l.status === "aktif").length,
      overdueLoans: overdueLoans.length,
      totalReturns: returns.length,
    });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil statistik" });
  });
});

router.get("/overdue", (req, res) => {
  (async () => {
    const today = new Date();
    const loans = await loansRepo.list({ status: "aktif" });
    const overdueLoans = loans.filter((loan) => {
      const returnDate = new Date(loan.tanggalKembali);
      return returnDate < today;
    });
    res.json(overdueLoans);
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data overdue" });
  });
});

// Settings
router.get("/settings", (req, res) => {
  (async () => {
    const settings = (await settingsRepo.get()) || {};
    res.json(settings);
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil settings" });
  });
});

router.put("/settings", (req, res) => {
  (async () => {
    const {
      libraryName,
      maxLoanDays,
      finePerDay,
      maxBooksPerUser,
      autoRenewal,
      notificationDays,
    } = req.body || {};

    const settings = await settingsRepo.upsert({
      libraryName,
      maxLoanDays,
      finePerDay,
      maxBooksPerUser,
      autoRenewal,
      notificationDays,
    });

    res.json({
      message: "Pengaturan berhasil disimpan",
      settings,
    });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan settings" });
  });
});

router.post("/confirm-return", (req, res) => {
  (async () => {
    const {
      returnLoanId,
      returnBookId,
      returnBorrowerName,
      returnCondition,
      returnNotes,
    } = req.body;
    if (!returnLoanId || !returnBookId || !returnBorrowerName) {
      return res
        .status(400)
        .json({
          message: "ID Peminjaman, ID Buku, dan Nama Peminjam harus diisi",
        });
    }
    const loans = await loansRepo.list({ status: "aktif" });
    const activeLoan = loans.find(
      (l) =>
        l.id === returnLoanId &&
        l.idBuku === returnBookId &&
        l.nama === returnBorrowerName
    );
    if (!activeLoan)
      return res
        .status(404)
        .json({ message: "Peminjaman aktif tidak ditemukan" });
    const today = new Date();
    const returnDate = new Date(activeLoan.tanggalKembali);
    const daysLate = Math.max(
      0,
      Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24))
    );
    const settings = (await settingsRepo.get()) || {};
    const finePerDay = settings.finePerDay || 1000;
    const fine = daysLate * finePerDay;
    const newReturn = {
      id: `R${String(Date.now()).slice(-6)}`,
      idBuku: returnBookId,
      idUser: activeLoan.idUser,
      nama: returnBorrowerName,
      tanggalPinjam: activeLoan.tanggalPinjam,
      tanggalKembali: activeLoan.tanggalKembali,
      tanggalPengembalian: today.toISOString().split("T")[0],
      denda: fine,
      status: "selesai",
      kondisiBuku: returnCondition || "baik",
      catatan: returnNotes || "",
    };
    await returnsRepo.create(newReturn);
    await loansRepo.setStatus(activeLoan.id, "dikembalikan");
    await booksRepo.incrementStock(returnBookId);
    res
      .status(201)
      .json({
        message: "Pengembalian berhasil dikonfirmasi",
        return: newReturn,
        fine,
      });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal konfirmasi pengembalian" });
  });
});

module.exports = router;
