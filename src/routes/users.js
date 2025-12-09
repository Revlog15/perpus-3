const express = require("express");
const store = require("../store");

const router = express.Router();

router.get("/", (req, res) => {
  const normalized = (store.users || []).map((u) => ({
    ...u,
    nama: u.nama || u.username || "",
    telepon: u.telepon || u.phone || "",
    role: u.role || "user",
    status: u.status || "active",
    createdAt: u.createdAt || "",
  }));
  res.json(normalized);
});

// Get single user by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const u = (store.users || []).find((user) => user.id === id);
  if (!u) return res.status(404).json({ message: "User tidak ditemukan" });
  const normalized = {
    ...u,
    nama: u.nama || u.username || "",
    telepon: u.telepon || u.phone || "",
    role: u.role || "user",
    status: u.status || "active",
    createdAt: u.createdAt || "",
  };
  res.json(normalized);
});

router.post("/", (req, res) => {
  const { username, email, telepon, password, fullName, nis, gender, confirmPassword } = req.body;
  
  // Validate all required fields
  if (!username || !email || !telepon || !password || !fullName || !nis || !gender) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  // Validate NIS format (10 digits)
  if (!/^\d{10}$/.test(nis)) {
    return res.status(400).json({ message: "NIS harus 10 digit angka" });
  }

  // Validate phone is numeric
  if (!/^[0-9]+$/.test(telepon)) {
    return res.status(400).json({ message: "Nomor telepon harus angka" });
  }

  // Check password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Password tidak sama" });
  }

  // Check if email or username already exists
  const existingUser = store.users.find(
    (u) =>
      (u.email || "").toLowerCase() === String(email).toLowerCase() ||
      (u.username || "").toLowerCase() === String(username).toLowerCase() ||
      (u.nis || "") === String(nis)
  );
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "Email, Username, atau NIS sudah digunakan" });
  }

  const newUserId = `U${String(store.users.length + 1).padStart(3, "0")}`;
  const newUser = {
    id: newUserId,
    username,
    email,
    telepon,
    password,
    fullName,
    nis,
    gender,
    role: "user",
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  };
  store.users.push(newUser);
  try {
    store.saveUsers();
  } catch (_) {}
  res.status(201).json({ message: "User berhasil ditambahkan", user: newUser });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { username, email, telepon, password, status, fullName, nis, gender } = req.body;
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1)
    return res.status(404).json({ message: "User tidak ditemukan" });
  const exists = store.users.find(
    (u) =>
      ((u.email || "").toLowerCase() === String(email).toLowerCase() ||
        (u.username || "").toLowerCase() === String(username).toLowerCase()) &&
      u.id !== id
  );
  if (exists) return res.status(400).json({ message: "Email sudah digunakan" });
  const updateData = { username, email, telepon, status: status || "active" };
  if (password) updateData.password = password;
  if (fullName !== undefined) updateData.fullName = fullName;
  if (nis !== undefined) updateData.nis = nis;
  if (gender !== undefined) updateData.gender = gender;
  store.users[idx] = { ...store.users[idx], ...updateData };
  try {
    store.saveUsers();
  } catch (_) {}
  res.json({ message: "User berhasil diupdate", user: store.users[idx] });
});

router.post("/:id/reset-password", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1)
    return res.status(404).json({ message: "User tidak ditemukan" });
  if (!password)
    return res.status(400).json({ message: "Password harus diisi" });
  store.users[idx].password = password;
  try {
    store.saveUsers();
  } catch (_) {}
  res.json({ message: "Password berhasil direset" });
});

router.put("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1)
    return res.status(404).json({ message: "User tidak ditemukan" });
  if (!["active", "inactive"].includes(status))
    return res.status(400).json({ message: "Status tidak valid" });
  store.users[idx].status = status;
  try {
    store.saveUsers();
  } catch (_) {}
  res.json({
    message: `User berhasil ${
      status === "active" ? "diaktifkan" : "dinonaktifkan"
    }`,
    user: store.users[idx],
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1)
    return res.status(404).json({ message: "User tidak ditemukan" });
  const activeLoans = store.loans.filter(
    (loan) => loan.idUser === id && loan.status === "aktif"
  );
  if (activeLoans.length > 0) {
    return res
      .status(400)
      .json({
        message: `Tidak dapat menghapus user karena masih memiliki ${activeLoans.length} peminjaman aktif`,
      });
  }
  const deletedUser = store.users.splice(idx, 1)[0];
  try {
    store.saveUsers();
  } catch (_) {}
  res.json({ message: "User berhasil dihapus", user: deletedUser });
});

module.exports = router;
