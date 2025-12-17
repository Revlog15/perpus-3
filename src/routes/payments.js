const express = require("express");
const paymentsRepo = require("../db/payments");
const returnsRepo = require("../db/returns");
const loansRepo = require("../db/loans");
const booksRepo = require("../db/books");
const settingsRepo = require("../db/settings");

const router = express.Router();

// Get all payments
router.get("/", (req, res) => {
  (async () => {
    const { userId } = req.query;
    const data = await paymentsRepo.list({ userId });
    res.json(data);
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil payments" });
  });
});

// Get all unpaid fines (for admin)
router.get("/unpaid", (req, res) => {
  (async () => {
    const unpaidFines = (await returnsRepo.list()).filter(
      (r) => r.denda > 0 && r.status === "selesai" && !r.finePaid
    );

    const today = new Date();
    const settings = (await settingsRepo.get()) || {};
    const finePerDay = settings.finePerDay || 1000;

    const activeLoans = (await loansRepo.list({ status: "aktif" })) || [];

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
          namaBuku: null, // optional join
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
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data denda" });
  });
});

// Get user's unpaid fines
router.get("/unpaid/:userId", (req, res) => {
  (async () => {
    const { userId } = req.params;
    // Get all returns with unpaid fines for this user
    const unpaidFines = (await returnsRepo.list({ userId })).filter(
      (r) => r.denda > 0 && r.status === "selesai" && !r.finePaid
    );

    const today = new Date();
    const settings = (await settingsRepo.get()) || {};
    const finePerDay = settings.finePerDay || 1000;

    const activeLoans = (await loansRepo.list({ userId, status: "aktif" })) || [];

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
          namaBuku: null, // optional join
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
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil denda user" });
  });
});

// Pay fine for a specific return
router.post("/pay-return", (req, res) => {
  (async () => {
    const { returnId, amount, paymentMethod = "cash" } = req.body;

    if (!returnId || !amount) {
      return res
        .status(400)
        .json({ message: "Return ID dan amount harus diisi" });
    }

    const allReturns = await returnsRepo.list();
    const returnRecord = allReturns.find((r) => r.id === returnId);
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

    const payment = {
      id: `P${String(Date.now()).slice(-6)}`,
      returnId,
      idUser: returnRecord.idUser,
      nama: returnRecord.nama,
      amount: returnRecord.denda,
      paymentMethod,
      tanggalBayar: new Date().toISOString().split("T")[0],
      status: "completed",
    };

    await paymentsRepo.create(payment);
    await returnsRepo.markFinePaid(returnId, payment.id);

    res.status(201).json({
      message: "Denda berhasil dibayar",
      payment,
      change: amount - returnRecord.denda,
    });
  })().catch((error) => {
    console.error("Error saving payment data:", error);
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  });
});

// Pay fine for active loan (early payment)
router.post("/pay-active", (req, res) => {
  (async () => {
    const { loanId, amount, paymentMethod = "cash" } = req.body;

    if (!loanId || !amount) {
      return res.status(400).json({ message: "Loan ID dan amount harus diisi" });
    }

    const loan = await loansRepo.getById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Data peminjaman tidak ditemukan" });
    }

    if (loan.status !== "aktif") {
      return res.status(400).json({ message: "Peminjaman tidak aktif" });
    }

    const today = new Date();
    const dueDate = new Date(loan.tanggalKembali);
    const daysLate = Math.max(
      0,
      Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
    );
    const settings = (await settingsRepo.get()) || {};
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

    const payment = {
      id: `P${String(Date.now()).slice(-6)}`,
      loanId,
      idUser: loan.idUser,
      nama: loan.nama,
      amount: currentFine,
      paymentMethod,
      tanggalBayar: new Date().toISOString().split("T")[0],
      status: "completed",
      type: "active_loan",
    };

    await paymentsRepo.create(payment);
    await loansRepo.markFinePaid(loanId, payment.id);

    res.status(201).json({
      message: "Denda berhasil dibayar",
      payment,
      change: amount - currentFine,
      daysLate,
      finePerDay,
    });
  })().catch((error) => {
    console.error("Error saving payment data:", error);
    res.status(500).json({ message: "Gagal memproses pembayaran" });
  });
});

// Get payment history for user
router.get("/history/:userId", (req, res) => {
  (async () => {
    const { userId } = req.params;
    const userPayments = (await paymentsRepo.list({ userId })) || [];
    userPayments.sort(
      (a, b) => new Date(b.tanggalBayar) - new Date(a.tanggalBayar)
    );
    res.json(userPayments);
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil riwayat pembayaran" });
  });
});

module.exports = router;
