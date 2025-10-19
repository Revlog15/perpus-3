import { API_BASE } from "./api.js";

export async function renderHistory(target) {
  target.innerHTML =
    '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  try {
    const idUser = localStorage.getItem("userid");
    if (!idUser) {
      target.innerHTML =
        '<div class="alert alert-warning">Silakan login untuk melihat riwayat</div>';
      return;
    }

    // Get all loans and books data
    const [loansRes, booksRes] = await Promise.all([
      fetch(`${API_BASE}/loans`),
      fetch(`${API_BASE}/books`),
    ]);

    const [loans, books] = await Promise.all([
      loansRes.json(),
      booksRes.json(),
    ]);

    // Filter loans for current user
    const userLoans = loans.filter((loan) => loan.idUser === idUser);

    if (!userLoans || userLoans.length === 0) {
      target.innerHTML =
        '<div class="alert alert-info">Belum ada riwayat peminjaman</div>';
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
          <th>Status</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    const today = new Date();

    // Sort by loan date (newest first)
    userLoans.sort(
      (a, b) => new Date(b.tanggalPinjam) - new Date(a.tanggalPinjam)
    );

    userLoans.forEach((loan) => {
      const book = books.find((b) => b.idBuku === loan.idBuku);
      const returnDate = new Date(loan.tanggalKembali);
      const isOverdue = today > returnDate && loan.status === "aktif";

      let status, statusClass;
      if (loan.status === "aktif") {
        status = isOverdue ? "Terlambat" : "Dipinjam";
        statusClass = isOverdue ? "danger" : "primary";
      } else {
        status = "Dikembalikan";
        statusClass = "success";
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${loan.id}</td>
        <td>${book ? book.namaBuku : loan.idBuku}</td>
        <td>${loan.tanggalPinjam}</td>
        <td><span class="badge bg-${statusClass}">${status}</span></td>
        <td>${
          loan.status === "aktif"
            ? `Jatuh tempo: ${loan.tanggalKembali}`
            : loan.finePaid
            ? "Denda telah dibayar"
            : "Tepat waktu"
        }</td>
      `;
      tbody.appendChild(tr);
    });

    target.innerHTML = "";
    target.appendChild(table);
  } catch (err) {
    console.error("Error in renderHistory:", err);
    target.innerHTML =
      '<div class="alert alert-danger">Gagal memuat riwayat peminjaman</div>';
  }
}
