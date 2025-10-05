export const API_BASE = window.API_BASE || 'http://localhost:3001/api';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let body;
  try { body = await res.json(); } catch (_) { body = null; }
  if (!res.ok) {
    const message = body && (body.message || body.error) ? (body.message || body.error) : `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return body;
}


