const express = require("express");
const usersRepo = require("../db/users");
const loansRepo = require("../db/loans");

const router = express.Router();

router.get("/", (req, res) => {
  // keep handler sync wrapper; delegate to async inside
  (async () => {
    const users = await usersRepo.getAll();
    const normalized = (users || []).map((u) => ({
      ...u,
      nama: u.fullName || u.username || "",
      telepon: u.telepon || "",
      role: u.role || "user",
      status: u.status || "active",
      createdAt: u.createdAt || "",
    }));
    res.json(normalized);
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data users" });
  });
});

// Get single user by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const u = await usersRepo.getById(id);
  if (!u) return res.status(404).json({ message: "User tidak ditemukan" });
  const normalized = {
    ...u,
    nama: u.fullName || u.username || "",
    telepon: u.telepon || "",
    role: u.role || "user",
    status: u.status || "active",
    createdAt: u.createdAt || "",
  };
  res.json(normalized);
});

router.post("/", (req, res) => {
  (async () => {
    const { username, email, telepon, password, fullName, nis, gender, confirmPassword, tahunMasuk } = req.body;

    if (!username || !email || !telepon || !password || !fullName || !nis || !gender) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }
    if (!/^\d{10}$/.test(String(nis))) {
      return res.status(400).json({ message: "NIS harus 10 digit angka" });
    }
    if (!/^[0-9]+$/.test(String(telepon))) {
      return res.status(400).json({ message: "Nomor telepon harus angka" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sama" });
    }

    if (tahunMasuk && !/^\d{4}$/.test(String(tahunMasuk))) {
      return res.status(400).json({ message: "Tahun masuk harus 4 digit angka" });
    }

    const exists = await usersRepo.existsWithEmailUsernameNis({ email, username, nis });
    if (exists) {
      return res.status(400).json({ message: "Email, Username, atau NIS sudah digunakan" });
    }

    const newUserId = await usersRepo.getNextId();
    const newUser = {
      id: newUserId,
      username,
      email,
      telepon,
      password,
      fullName,
      nis,
      gender,
      tahunMasuk,
      role: "user",
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    await usersRepo.create(newUser);
    res.status(201).json({ message: "User berhasil ditambahkan", user: newUser });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan user" });
  });
});

router.put("/:id", (req, res) => {
  (async () => {
    const { id } = req.params;
    const { username, email, telepon, password, status, fullName, nis, gender, tahunMasuk } = req.body;
    const existing = await usersRepo.getById(id);
    if (!existing) return res.status(404).json({ message: "User tidak ditemukan" });

    const conflict = await usersRepo.existsWithEmailUsernameNis({ email, username, nis }, id);
    if (conflict) return res.status(400).json({ message: "Email/Username/NIS sudah digunakan" });

    const updateData = { username, email, telepon, status: status || "active" };
    if (password) updateData.password = password;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (nis !== undefined) updateData.nis = nis;
    if (gender !== undefined) updateData.gender = gender;
    if (tahunMasuk !== undefined) {
      if (tahunMasuk && !/^\d{4}$/.test(String(tahunMasuk))) {
        return res.status(400).json({ message: "Tahun masuk harus 4 digit angka" });
      }
      updateData.tahunMasuk = tahunMasuk;
    }

    const updated = await usersRepo.update(id, updateData);
    res.json({ message: "User berhasil diupdate", user: updated });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate user" });
  });
});

router.post("/:id/reset-password", (req, res) => {
  (async () => {
    const { id } = req.params;
    const { password } = req.body;
    const existing = await usersRepo.getById(id);
    if (!existing) return res.status(404).json({ message: "User tidak ditemukan" });
    if (!password) return res.status(400).json({ message: "Password harus diisi" });
    const updated = await usersRepo.update(id, { password });
    res.json({ message: "Password berhasil direset", user: updated });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal reset password" });
  });
});

router.put("/:id/status", (req, res) => {
  (async () => {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await usersRepo.getById(id);
    if (!existing) return res.status(404).json({ message: "User tidak ditemukan" });
    if (!["active", "inactive"].includes(status))
      return res.status(400).json({ message: "Status tidak valid" });
    const updated = await usersRepo.update(id, { status });
    res.json({
      message: `User berhasil ${status === "active" ? "diaktifkan" : "dinonaktifkan"}`,
      user: updated,
    });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal mengubah status user" });
  });
});

router.delete("/:id", (req, res) => {
  (async () => {
    const { id } = req.params;
    const existing = await usersRepo.getById(id);
    if (!existing)
      return res.status(404).json({ message: "User tidak ditemukan" });
    const activeCount = await loansRepo.countActiveByUser(id);
    if (activeCount > 0) {
      return res.status(400).json({
        message: `Tidak dapat menghapus user karena masih memiliki ${activeCount} peminjaman aktif`,
      });
    }
    await usersRepo.remove(id);
    res.json({ message: "User berhasil dihapus", user: existing });
  })().catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus user" });
  });
});

module.exports = router;
