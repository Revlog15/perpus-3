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

    const [historyRes, booksRes] = await Promise.all([
      fetch(`${API_BASE}/loans/history/${encodeURIComponent(idUser)}`),
      fetch(`${API_BASE}/books`),
    ]);

    const [history, books] = await Promise.all([
      historyRes.json(),
      booksRes.json(),
    ]);

    if (!history.activeLoans?.length && !history.returnHistory?.length) {
      target.innerHTML =
        '<div class="alert alert-info">Belum ada riwayat peminjaman</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Buku</th>
          <th>Status</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    const allRecords = [];

    // Process active loans
    if (history.activeLoans?.length) {
      history.activeLoans.forEach((loan) => {
        const book = books.find((b) => b.idBuku === loan.idBuku);
        allRecords.push({
          date: loan.tanggalPinjam,
          book: book?.namaBuku || loan.idBuku,
          status: "Dipinjam",
          info: `Jatuh tempo: ${loan.tanggalKembali}`,
          type: "loan",
        });
      });
    }

    // Process return history
    if (history.returnHistory?.length) {
      history.returnHistory.forEach((ret) => {
        const book = books.find((b) => b.idBuku === ret.idBuku);
        allRecords.push({
          date: ret.tanggalPengembalian,
          book: book?.namaBuku || ret.idBuku,
          status: "Dikembalikan",
          info:
            ret.denda > 0
              ? `Denda: Rp ${ret.denda.toLocaleString()}`
              : "Tepat waktu",
          type: "return",
        });
      });
    }

    // Sort by date (newest first)
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    allRecords.forEach((record) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${record.date}</td>
        <td>${record.book}</td>
        <td><span class="badge bg-${
          record.type === "loan" ? "primary" : "success"
        }">${record.status}</span></td>
        <td>${record.info}</td>
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
