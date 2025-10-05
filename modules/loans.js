// Loans (Pinjam) module

const API_BASE = window.API_BASE || 'http://localhost:3001/api';

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

  const form = target.querySelector('#loanForm');
  const msg = target.querySelector('#loanMessage');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const idUser = localStorage.getItem('userid');
    if (!idUser) {
      msg.className = 'alert alert-danger';
      msg.textContent = 'Silakan login terlebih dahulu';
      return;
    }
    data.idUser = idUser;
    try {
      const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const out = await res.json();
      msg.className = res.ok ? 'alert alert-success' : 'alert alert-danger';
      msg.textContent = out.message || (res.ok ? 'Berhasil meminjam buku' : 'Gagal meminjam buku');
      if (res.ok) form.reset();
    } catch (err) {
      msg.className = 'alert alert-danger';
      msg.textContent = 'Terjadi kesalahan jaringan';
    }
  });
}

export async function renderLoanStatus(target) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const idUser = localStorage.getItem('userid');
    const qs = idUser ? `?userId=${encodeURIComponent(idUser)}&status=aktif` : '';
    const res = await fetch(`${API_BASE}/loans${qs}`);
    const loans = await res.json();
    target.innerHTML = '';
    if (!loans || loans.length === 0) {
      target.innerHTML = '<div class="text-muted">Belum ada peminjaman aktif</div>';
      return;
    }
    const list = document.createElement('div');
    list.className = 'list-group';
    loans.forEach(l => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `<span><strong>${l.idBuku}</strong> · ${l.nama} · Jatuh tempo: ${l.tanggalKembali}</span><span class="badge bg-${l.terlambat ? 'danger' : 'success'}">${l.terlambat ? 'Terlambat' : 'On-time'}</span>`;
      list.appendChild(item);
    });
    target.appendChild(list);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat status peminjaman</div>';
  }
}


