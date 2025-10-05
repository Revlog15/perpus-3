import { API_BASE } from './api.js';

export async function renderHistory(target) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const idUser = localStorage.getItem('userid');
    if (!idUser) {
      target.innerHTML = '<div class="text-danger text-center">Silakan login untuk melihat riwayat</div>';
      return;
    }
    const [historyRes, booksRes] = await Promise.all([
      fetch(`${API_BASE}/loans/history/${encodeURIComponent(idUser)}`),
      fetch(`${API_BASE}/books`)
    ]);
    const [history, books] = await Promise.all([
      historyRes.json(),
      booksRes.json()
    ]);
    target.innerHTML = '';
    const getTitle = (id) => {
      const book = Array.isArray(books) ? books.find(b => b.idBuku === id) : null;
      return book ? book.namaBuku : id;
    };
    const allRows = [
      ...(history.activeLoans || []).map(l => ({ tanggal: l.tanggalPinjam, idBuku: l.idBuku, judul: getTitle(l.idBuku), aksi: 'Pinjam' })),
      ...(history.returnHistory || []).map(r => ({ tanggal: r.tanggalPengembalian, idBuku: r.idBuku, judul: getTitle(r.idBuku), aksi: r.denda > 0 ? `Kembali (Denda Rp ${r.denda.toLocaleString()})` : 'Kembali' }))
    ];
    if (!allRows || allRows.length === 0) {
      target.innerHTML += '<div class="text-muted">Belum ada riwayat peminjaman</div>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'table table-striped';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>ID Buku</th>
          <th>Judul</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    allRows.forEach(h => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${h.tanggal}</td><td>${h.idBuku}</td><td>${h.judul}</td><td>${h.aksi}</td>`;
      tbody.appendChild(tr);
    });
    target.appendChild(table);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat riwayat</div>';
  }
}


