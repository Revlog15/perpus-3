// History (Riwayat Peminjaman) module

const API_BASE = window.API_BASE || 'http://localhost:3001/api';

export async function renderHistory(target) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch(`${API_BASE}/history`);
    const history = await res.json();
    target.innerHTML = '<h5 class="mb-3">Riwayat Peminjaman</h5>';
    if (!history || history.length === 0) {
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
    history.forEach(h => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${h.tanggal}</td><td>${h.idBuku}</td><td>${h.judul}</td><td>${h.aksi}</td>`;
      tbody.appendChild(tr);
    });
    target.appendChild(table);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat riwayat</div>';
  }
}


