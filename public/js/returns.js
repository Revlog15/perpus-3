import { API_BASE } from './api.js';

export function renderReturnForm(target) {
  target.innerHTML = `
    <h5 class="mb-3">Pengembalian Buku</h5>
    <form class="row g-3" id="returnForm">
      <div class="col-md-6">
        <label class="form-label">ID Buku</label>
        <input type="text" class="form-control" name="idBuku" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">User</label>
        <input type="text" class="form-control" value="Akan memakai akun login" disabled>
      </div>
      <div class="col-12">
        <button class="btn btn-success" type="submit">Kembalikan</button>
      </div>
    </form>
    <div id="returnMessage" class="mt-3"></div>
  `;

  const form = target.querySelector('#returnForm');
  const msg = target.querySelector('#returnMessage');
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
      const res = await fetch(`${API_BASE}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const out = await res.json();
      msg.className = res.ok ? 'alert alert-success' : 'alert alert-danger';
      msg.textContent = out.message || (res.ok ? 'Berhasil mengembalikan buku' : 'Gagal mengembalikan buku');
      if (res.ok) form.reset();
    } catch (err) {
      msg.className = 'alert alert-danger';
      msg.textContent = 'Terjadi kesalahan jaringan';
    }
  });
}


