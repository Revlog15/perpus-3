// Externalized loan (pinjam) and return/status functions
// Relies on global variables: API_BASE, books and bootstrap (already on the page)

// Function to open pinjam modal from book detail
function openPinjamModal() {
  const bookModal = bootstrap.Modal.getInstance(document.getElementById('bookModal'));
  const pinjamModal = new bootstrap.Modal(document.getElementById('pinjamModal'));

  // Get book ID from current book detail
  const bookId = document.getElementById('bookTitle').textContent;
  const book = books.find(b => b.namaBuku === bookId);
  if (book) {
    const el = document.getElementById('pinjamIdBuku');
    if (el) el.value = book.idBuku;
  }

  if (bookModal) bookModal.hide();
  pinjamModal.show();
}

// Function to submit pinjam form
async function submitPinjam() {
  const form = document.getElementById('pinjamForm');
  const messageDiv = document.getElementById('pinjamMessage');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  // Attach logged-in user id if available
  const uid = localStorage.getItem('userid');
  if (uid) data.idUser = uid;

  // Clear previous message
  if (messageDiv) messageDiv.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
      form.reset();
      // Refresh user data and books
      if (typeof loadUserData === 'function') loadUserData();
      if (typeof loadPopularBooks === 'function') loadPopularBooks();
    } else {
      if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
    }
  } catch (error) {
    if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan: ${error.message}</div>`;
  }
}

// Function to submit pengembalian form
async function submitPengembalian() {
  const form = document.getElementById('pengembalianForm');
  const messageDiv = document.getElementById('pengembalianMessage');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Clear previous message
  if (messageDiv) messageDiv.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE}/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
      if (result.return && result.return.denda > 0 && messageDiv) {
        messageDiv.innerHTML += `<div class="alert alert-warning">Denda: Rp ${result.return.denda.toLocaleString()}</div>`;
      }
      form.reset();
      // Refresh user data and books
      if (typeof loadUserData === 'function') loadUserData();
      if (typeof loadPopularBooks === 'function') loadPopularBooks();
    } else {
      if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
    }
  } catch (error) {
    if (messageDiv) messageDiv.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan: ${error.message}</div>`;
  }
}

// Function to load loan status
async function loadLoanStatus() {
  const resultsContainer = document.querySelector('.popular-books');
  const sectionTitle = document.getElementById('sectionTitle');

  // Show loading state
  if (sectionTitle) {
    sectionTitle.textContent = 'Memuat Status Peminjaman...';
  }
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  }

  try {
    const response = await fetch(`${API_BASE}/loans`);
    const loans = await response.json();

    if (sectionTitle) {
      sectionTitle.textContent = `Status Peminjaman (${loans.length} aktif)`;
    }

    if (resultsContainer) {
      resultsContainer.innerHTML = '';

      if (loans.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12 text-center text-muted"><i class="fas fa-book-open me-2"></i>Tidak ada peminjaman aktif</div>';
        return;
      }

      const listGroup = document.createElement('div');
      listGroup.className = 'list-group';

      loans.forEach(loan => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        const book = books.find(b => b.idBuku === loan.idBuku);
        const bookName = book ? book.namaBuku : 'Buku tidak ditemukan';

        listItem.innerHTML = `
          <div>
            <h6 class="mb-1">${bookName}</h6>
            <small class="text-muted">ID: ${loan.idBuku} | Peminjam: ${loan.nama}</small>
            <br>
            <small class="text-info">Pinjam: ${loan.tanggalPinjam} | Jatuh tempo: ${loan.tanggalKembali}</small>
          </div>
          <span class="badge ${loan.terlambat ? 'bg-danger' : 'bg-success'}">
            ${loan.terlambat ? 'Terlambat' : 'On-time'}
          </span>
        `;

        listGroup.appendChild(listItem);
      });

      resultsContainer.appendChild(listGroup);
    }
  } catch (error) {
    console.error('Error loading loan status:', error);
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="col-12 text-center text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Gagal memuat status peminjaman</div>';
    }
    if (sectionTitle) {
      sectionTitle.textContent = 'Status Peminjaman';
    }
  }
}

// Function to load loan history
async function loadLoanHistory() {
  const resultsContainer = document.querySelector('.popular-books');
  const sectionTitle = document.getElementById('sectionTitle');

  // Show loading state
  if (sectionTitle) {
    sectionTitle.textContent = 'Memuat Riwayat Peminjaman...';
  }
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  }

  try {
    const response = await fetch(`${API_BASE}/returns`);
    const returns = await response.json();

    if (sectionTitle) {
      sectionTitle.textContent = `Riwayat Peminjaman (${returns.length} selesai)`;
    }

    if (resultsContainer) {
      resultsContainer.innerHTML = '';

      if (returns.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12 text-center text-muted"><i class="fas fa-history me-2"></i>Belum ada riwayat peminjaman</div>';
        return;
      }

      const listGroup = document.createElement('div');
      listGroup.className = 'list-group';

      returns.forEach(returnItem => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item';

        const book = books.find(b => b.idBuku === returnItem.idBuku);
        const bookName = book ? book.namaBuku : 'Buku tidak ditemukan';

        listItem.innerHTML = `
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">${bookName}</h6>
              <small class="text-muted">ID: ${returnItem.idBuku} | Peminjam: ${returnItem.nama}</small>
              <br>
              <small class="text-info">Pinjam: ${returnItem.tanggalPinjam} | Kembali: ${returnItem.tanggalPengembalian}</small>
            </div>
            <div class="text-end">
              <span class="badge ${returnItem.denda > 0 ? 'bg-warning' : 'bg-success'}">
                ${returnItem.denda > 0 ? `Denda: Rp ${returnItem.denda.toLocaleString()}` : 'Tepat Waktu'}
              </span>
            </div>
          </div>
        `;

        listGroup.appendChild(listItem);
      });

      resultsContainer.appendChild(listGroup);
    }
  } catch (error) {
    console.error('Error loading loan history:', error);
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="col-12 text-center text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Gagal memuat riwayat peminjaman</div>';
    }
    if (sectionTitle) {
      sectionTitle.textContent = 'Riwayat Peminjaman';
    }
  }
}
