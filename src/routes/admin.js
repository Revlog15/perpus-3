const express = require("express");
const store = require("../store");

const router = express.Router();

router.get("/stats", (req, res) => {
  const today = new Date();
  const overdueLoans = store.loans.filter((loan) => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === "aktif";
  });
  res.json({
    totalBooks: store.books.length,
    totalUsers: store.users.filter(
      (u) => String(u.role || "").toLowerCase() !== "admin"
    ).length,
    activeLoans: store.loans.filter((l) => l.status === "aktif").length,
    overdueLoans: overdueLoans.length,
    totalReturns: store.returns.length,
  });
});

router.get("/overdue", (req, res) => {
  const today = new Date();
  const overdueLoans = store.loans.filter((loan) => {
    const returnDate = new Date(loan.tanggalKembali);
    return returnDate < today && loan.status === "aktif";
  });
  res.json(overdueLoans);
});

// Settings
router.get("/settings", (req, res) => {
  res.json(store.settings || {});
});

router.put("/settings", (req, res) => {
  const {
    libraryName,
    maxLoanDays,
    finePerDay,
    maxBooksPerUser,
    autoRenewal,
    notificationDays,
  } = req.body || {};

  const current = store.settings || {};
  const next = {
    libraryName: libraryName ?? current.libraryName ?? "E-Library",
    maxLoanDays: Number.isFinite(Number(maxLoanDays))
      ? Number(maxLoanDays)
      : current.maxLoanDays ?? 7,
    finePerDay: Number.isFinite(Number(finePerDay))
      ? Number(finePerDay)
      : current.finePerDay ?? 1000,
    maxBooksPerUser: Number.isFinite(Number(maxBooksPerUser))
      ? Number(maxBooksPerUser)
      : current.maxBooksPerUser ?? 5,
    autoRenewal: autoRenewal ?? current.autoRenewal ?? "disabled",
    notificationDays: Number.isFinite(Number(notificationDays))
      ? Number(notificationDays)
      : current.notificationDays ?? 2,
  };

  store.settings = next;
  try {
    store.saveSettings();
  } catch (_) {}
  res.json({
    message: "Pengaturan berhasil disimpan",
    settings: store.settings,
  });
});

router.post("/confirm-return", (req, res) => {
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
  const activeLoan = store.loans.find(
    (l) =>
      l.id === returnLoanId &&
      l.idBuku === returnBookId &&
      l.nama === returnBorrowerName &&
      l.status === "aktif"
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
  const settings = store.settings || {};
  const finePerDay = settings.finePerDay || 1000;
  const fine = daysLate * finePerDay;
  const newReturn = {
    id: `R${String(store.returns.length + 1).padStart(3, "0")}`,
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
  store.returns.push(newReturn);
  activeLoan.status = "dikembalikan";
  const book = store.books.find((b) => b.idBuku === returnBookId);
  if (book) {
    book.stok += 1;
    try {
      store.saveBooks();
    } catch (_) {}
  }
  try {
    store.saveLoans();
  } catch (_) {}
  try {
    store.saveReturns();
  } catch (_) {}
  res
    .status(201)
    .json({
      message: "Pengembalian berhasil dikonfirmasi",
      return: newReturn,
      fine,
    });
});

module.exports = router;
