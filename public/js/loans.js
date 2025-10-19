import { API_BASE } from "./api.js";

export function renderLoanForm(target) {
  target.innerHTML = `
    <h5 class="mb-3">Form Pinjam Buku</h5>
    <form class="row g-3" id="loanForm">
      <div class="col-md-6">
        <label class="form-label">ID Buku</label>
        <input type="text" class="form-control" name="idBuku" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">User</label>
        <input type="text" class="form-control" value="Akan memakai akun login" disabled>
      </div>
      <div class="col-12">
        <button class="btn btn-primary" type="submit">Pinjam</button>
      </div>
    </form>
    <div id="loanMessage" class="mt-3"></div>
  `;

  const form = target.querySelector("#loanForm");
  const msg = target.querySelector("#loanMessage");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    const data = Object.fromEntries(new FormData(form).entries());
    const idUser = localStorage.getItem("userid");
    if (!idUser) {
      msg.className = "alert alert-danger";
      msg.textContent = "Silakan login terlebih dahulu";
      return;
    }

    // Load system settings for validation
    let systemSettings = {
      maxBooksPerUser: 5,
      maxLoanDays: 7,
    };
    try {
      const settingsRes = await fetch(`${API_BASE}/admin/settings`);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        systemSettings = { ...systemSettings, ...settings };
      }
    } catch (err) {
      console.warn("Failed to load system settings for validation:", err);
    }

    // Check current active loans count
    try {
      const loansRes = await fetch(
        `${API_BASE}/loans?userId=${encodeURIComponent(idUser)}&status=aktif`
      );
      if (loansRes.ok) {
        const activeLoans = await loansRes.json();
        if (
          Array.isArray(activeLoans) &&
          activeLoans.length >= systemSettings.maxBooksPerUser
        ) {
          msg.className = "alert alert-warning";
          msg.textContent = `Maksimal ${systemSettings.maxBooksPerUser} buku per user. Anda sudah meminjam ${activeLoans.length} buku.`;
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to check active loans:", err);
    }

    data.idUser = idUser;
    data.maxLoanDays = systemSettings.maxLoanDays;
    try {
      const res = await fetch(`${API_BASE}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      msg.className = res.ok ? "alert alert-success" : "alert alert-danger";
      msg.textContent =
        out.message ||
        (res.ok ? "Berhasil meminjam buku" : "Gagal meminjam buku");
      if (res.ok) form.reset();
    } catch (err) {
      msg.className = "alert alert-danger";
      msg.textContent = "Terjadi kesalahan jaringan";
    }
  });
}

export async function renderLoanStatus(target) {
  target.innerHTML =
    '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  try {
    const idUser = localStorage.getItem("userid");
    if (!idUser) {
      target.innerHTML =
        '<div class="alert alert-warning">Silakan login terlebih dahulu</div>';
      return;
    }

    // Fetch both loans and books data
    const [loansRes, booksRes] = await Promise.all([
      fetch(
        `${API_BASE}/loans?userId=${encodeURIComponent(idUser)}&status=aktif`
      ),
      fetch(`${API_BASE}/books`),
    ]);

    const [loans, books] = await Promise.all([
      loansRes.json(),
      booksRes.json(),
    ]);

    if (!Array.isArray(loans) || loans.length === 0) {
      target.innerHTML =
        '<div class="alert alert-info">Belum ada peminjaman aktif</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID Peminjaman</th>
          <th>Buku</th>
          <th>Tanggal Pinjam</th>
          <th>Jatuh Tempo</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    const today = new Date();

    loans.forEach((loan) => {
      const book = books.find((b) => b.idBuku === loan.idBuku);
      const returnDate = new Date(loan.tanggalKembali);
      const isOverdue = returnDate < today;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${loan.id}</td>
        <td>${book ? book.namaBuku : loan.idBuku}</td>
        <td>${loan.tanggalPinjam}</td>
        <td>${loan.tanggalKembali}</td>
        <td><span class="badge bg-${isOverdue ? "danger" : "success"}">${
        isOverdue ? "Terlambat" : "Aktif"
      }</span></td>
      `;
      tbody.appendChild(tr);
    });

    target.innerHTML = "";
    target.appendChild(table);
  } catch (err) {
    console.error("Error in renderLoanStatus:", err);
    target.innerHTML =
      '<div class="alert alert-danger">Gagal memuat status peminjaman</div>';
  }
}
