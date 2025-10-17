import { API_BASE } from './api.js';

function sanitizeForFilename(str) {
  return (str || '')
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function getImageCandidates(book) {
  const baseDir = 'images';
  const title = book?.namaBuku || '';
  const rawJpg = `${baseDir}/${title}.jpg`;
  const rawJpeg = `${baseDir}/${title}.jpeg`;
  const rawPng = `${baseDir}/${title}.png`;
  const sanitized = sanitizeForFilename(title);
  const sanJpg = `${baseDir}/${sanitized}.jpg`;
  const sanJpeg = `${baseDir}/${sanitized}.jpeg`;
  const sanPng = `${baseDir}/${sanitized}.png`;
  return [rawJpg, rawJpeg, rawPng, sanJpg, sanJpeg, sanPng];
}

function setBookImage(imgEl, book) {
  const candidates = getImageCandidates(book);
  let idx = 0;
  function tryNext() {
    if (idx >= candidates.length) {
      imgEl.onerror = null;
      imgEl.src = 'https://via.placeholder.com/300x180?text=No+Image';
      return;
    }
    const src = candidates[idx++];
    const parts = src.split('/');
    parts[parts.length - 1] = encodeURIComponent(parts[parts.length - 1]);
    imgEl.src = parts.join('/');
  }
  imgEl.onerror = tryNext;
  tryNext();
}

function renderGrid(container, books, onClick) {
  const row = document.createElement('div');
  row.className = 'row';
  books.forEach(book => {
    const col = document.createElement('div');
    col.className = 'col-md-2 mb-3';
    col.innerHTML = `
      <div class="card h-100">
        <img class="card-img-top" alt="${book.namaBuku}" style="height:180px;object-fit:cover">
        <div class="card-body p-2 text-center">
          <small class="d-block fw-semibold text-truncate" title="${book.namaBuku}">${book.namaBuku}</small>
          <small class="text-muted d-block text-truncate">${book.penulis}</small>
          <small class="${book.stok > 0 ? 'text-success' : 'text-danger'} d-block">Stok: ${book.stok}</small>
        </div>
      </div>`;
    setBookImage(col.querySelector('.card-img-top'), book);
    if (onClick) col.querySelector('.card').addEventListener('click', () => onClick(book));
    row.appendChild(col);
  });
  container.appendChild(row);
}

export async function renderPopularBooks(target, onCardClick) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch(`${API_BASE}/books/popular`);
    const books = await res.json();
    target.innerHTML = '';
    const h5 = document.createElement('h5'); h5.textContent = 'Buku Populer Minggu Ini'; target.appendChild(h5);
    renderGrid(target, books, onCardClick);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat buku populer</div>';
  }
}

export async function renderAllBooks(target, onCardClick) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch(`${API_BASE}/books`);
    const books = await res.json();
    target.innerHTML = '';
    const h5 = document.createElement('h5'); h5.textContent = `Semua Buku (${books.length})`; target.appendChild(h5);
    renderGrid(target, books, onCardClick);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat semua buku</div>';
  }
}

export async function renderAvailableBooks(target, onCardClick) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch(`${API_BASE}/books/available`);
    const books = await res.json();
    target.innerHTML = '';
    const h5 = document.createElement('h5'); h5.textContent = `Buku Tersedia (${books.length})`; target.appendChild(h5);
    renderGrid(target, books, onCardClick);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat buku tersedia</div>';
  }
}

export async function renderLatestBooks(target, onCardClick) {
  target.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch(`${API_BASE}/books/latest`);
    const books = await res.json();
    target.innerHTML = '';
    const h5 = document.createElement('h5'); h5.textContent = 'Buku Terbaru'; target.appendChild(h5);
    if (!books || books.length === 0) {
      target.innerHTML += '<div class="text-muted text-center py-5">Belum ada buku terbaru</div>';
      return;
    }
    renderGrid(target, books, onCardClick);
  } catch (e) {
    target.innerHTML = '<div class="text-danger text-center">Gagal memuat buku terbaru</div>';
  }
}


