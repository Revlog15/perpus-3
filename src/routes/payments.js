const express = require("express");
const store = require("../store");

const router = express.Router();

// Get all payments
router.get("/", (req, res) => {
  const { userId } = req.query;
  let data = store.payments || [];
  if (userId) data = data.filter((p) => p.idUser === userId);
  res.json(data);
});

// Get all unpaid fines (for admin)
router.get("/unpaid", (req, res) => {
  // Get all returns with unpaid fines
  const unpaidFines = store.returns.filter(
    (r) => r.denda > 0 && r.status === "selesai" && !r.finePaid
  );

  // Calculate current fines for all active loans
  const today = new Date();
  const settings = store.settings || {};
  const finePerDay = settings.finePerDay || 1000;

  const activeLoans = store.loans.filter((l) => l.status === "aktif");

  const currentFines = activeLoans
    .map((loan) => {
      const dueDate = new Date(loan.tanggalKembali);
      const daysLate = Math.max(
        0,
        Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
      );
      const fine = daysLate * finePerDay;

      return {
        loanId: loan.id,
        idBuku: loan.idBuku,
        namaBuku:
          store.books.find((b) => b.idBuku === loan.idBuku)?.namaBuku ||
          "Unknown",
        idUser: loan.idUser,
        nama: loan.nama,
        tanggalPinjam: loan.tanggalPinjam,
        tanggalKembali: loan.tanggalKembali,
        daysLate,
        fine,
        type: "active",
        finePaid: loan.finePaid || false,
      };
    })
    .filter((fine) => fine.fine > 0 && !fine.finePaid);

  res.json({
    unpaidReturns: unpaidFines,
    currentFines: currentFines,
    totalUnpaid: unpaidFines.reduce((sum, r) => sum + r.denda, 0),
    totalCurrent: currentFines.reduce((sum, f) => sum + f.fine, 0),
  });
});

// Get user's unpaid fines
router.get("/unpaid/:userId", (req, res) => {
  const { userId } = req.params;
  const user = store.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  // Get all returns with unpaid fines for this user
  const unpaidFines = store.returns.filter(
    (r) =>
      r.idUser === userId &&
      r.denda > 0 &&
      r.status === "selesai" &&
      !r.finePaid
  );

  // Calculate current fines for active loans
  const today = new Date();
  const settings = store.settings || {};
  const finePerDay = settings.finePerDay || 1000;

  const activeLoans = store.loans.filter(
    (l) => l.idUser === userId && l.status === "aktif"
  );

  const currentFines = activeLoans
    .map((loan) => {
      const dueDate = new Date(loan.tanggalKembali);
      const daysLate = Math.max(
        0,
        Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
      );
      const fine = daysLate * finePerDay;

      return {
        loanId: loan.id,
        idBuku: loan.idBuku,
        namaBuku:
          store.books.find((b) => b.idBuku === loan.idBuku)?.namaBuku ||
          "Unknown",
        tanggalPinjam: loan.tanggalPinjam,
        tanggalKembali: loan.tanggalKembali,
        daysLate,
        fine,
        type: "active",
        finePaid: loan.finePaid || false,
      };
    })
    .filter((fine) => fine.fine > 0 && !fine.finePaid);

  res.json({
    unpaidReturns: unpaidFines,
    currentFines: currentFines,
    totalUnpaid: unpaidFines.reduce((sum, r) => sum + r.denda, 0),
    totalCurrent: currentFines.reduce((sum, f) => sum + f.fine, 0),
  });
});

// Pay fine for a specific return
router.post("/pay-return", (req, res) => {
  const { returnId, amount, paymentMethod = "cash" } = req.body;

  if (!returnId || !amount) {
    return res
      .status(400)
      .json({ message: "Return ID dan amount harus diisi" });
  }

  const returnRecord = store.returns.find((r) => r.id === returnId);
  if (!returnRecord) {
    return res
      .status(404)
      .json({ message: "Data pengembalian tidak ditemukan" });
  }

  if (returnRecord.finePaid) {
    return res.status(400).json({ message: "Denda sudah dibayar" });
  }

  if (amount < returnRecord.denda) {
    return res.status(400).json({
      message: "Jumlah pembayaran kurang dari denda yang harus dibayar",
    });
  }

  // Create payment record
  const payment = {
    id: `P${String((store.payments || []).length + 1).padStart(3, "0")}`,
    returnId,
    idUser: returnRecord.idUser,
    nama: returnRecord.nama,
    amount: returnRecord.denda,
    paymentMethod,
    tanggalBayar: new Date().toISOString().split("T")[0],
    status: "completed",
  };

  // Add to payments array
  if (!store.payments) store.payments = [];
  store.payments.push(payment);

  // Mark return as paid
  returnRecord.finePaid = true;
  returnRecord.paymentId = payment.id;

  try {
    store.saveReturns();
    store.savePayments();
  } catch (error) {
    console.error("Error saving payment data:", error);
  }

  res.status(201).json({
    message: "Denda berhasil dibayar",
    payment,
    change: amount - returnRecord.denda,
  });
});

// Pay fine for active loan (early payment)
router.post("/pay-active", (req, res) => {
  const { loanId, amount, paymentMethod = "cash" } = req.body;

  if (!loanId || !amount) {
    return res.status(400).json({ message: "Loan ID dan amount harus diisi" });
  }

  const loan = store.loans.find((l) => l.id === loanId);
  if (!loan) {
    return res.status(404).json({ message: "Data peminjaman tidak ditemukan" });
  }

  if (loan.status !== "aktif") {
    return res.status(400).json({ message: "Peminjaman tidak aktif" });
  }

  // Calculate current fine
  const today = new Date();
  const dueDate = new Date(loan.tanggalKembali);
  const daysLate = Math.max(
    0,
    Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
  );
  const settings = store.settings || {};
  const finePerDay = settings.finePerDay || 1000;
  const currentFine = daysLate * finePerDay;

  if (currentFine <= 0) {
    return res
      .status(400)
      .json({ message: "Tidak ada denda untuk peminjaman ini" });
  }

  if (amount < currentFine) {
    return res.status(400).json({
      message: "Jumlah pembayaran kurang dari denda yang harus dibayar",
    });
  }

  // Create payment record
  const payment = {
    id: `P${String((store.payments || []).length + 1).padStart(3, "0")}`,
    loanId,
    idUser: loan.idUser,
    nama: loan.nama,
    amount: currentFine,
    paymentMethod,
    tanggalBayar: new Date().toISOString().split("T")[0],
    status: "completed",
    type: "active_loan",
  };

  // Add to payments array
  if (!store.payments) store.payments = [];
  store.payments.push(payment);

  // Mark loan as fine paid
  loan.finePaid = true;
  loan.paymentId = payment.id;

  try {
    store.saveLoans();
    store.savePayments();
  } catch (error) {
    console.error("Error saving payment data:", error);
  }

  res.status(201).json({
    message: "Denda berhasil dibayar",
    payment,
    change: amount - currentFine,
    daysLate,
    finePerDay,
  });
});

// Get payment history for user
router.get("/history/:userId", (req, res) => {
  const { userId } = req.params;
  const userPayments = (store.payments || []).filter(
    (p) => p.idUser === userId
  );

  // Sort by payment date (newest first)
  userPayments.sort(
    (a, b) => new Date(b.tanggalBayar) - new Date(a.tanggalBayar)
  );

  res.json(userPayments);
});

module.exports = router;
