const { query } = require('./index');

async function get() {
  // Tabel di DB bernama system_settings dengan kolom snake_case
  const rows = await query(
    'SELECT library_name AS libraryName, max_loan_days AS maxLoanDays, max_books_per_user AS maxBooksPerUser, auto_renewal AS autoRenewal, notification_days AS notificationDays FROM system_settings LIMIT 1',
    []
  );
  return rows[0] || null;
}

async function upsert(settings) {
  const current = await get();
  const next = { ...(current || {}), ...settings };
  await query(
    `REPLACE INTO system_settings (library_name, max_loan_days, max_books_per_user, auto_renewal, notification_days)
     VALUES (?, ?, ?, ?, ?)`,
    [
      next.libraryName || 'NesPus',
      Number.isFinite(Number(next.maxLoanDays)) ? Number(next.maxLoanDays) : 7,
      Number.isFinite(Number(next.maxBooksPerUser)) ? Number(next.maxBooksPerUser) : 5,
      next.autoRenewal || 'disabled',
      Number.isFinite(Number(next.notificationDays)) ? Number(next.notificationDays) : 2,
    ]
  );
  return get();
}

module.exports = {
  get,
  upsert,
};


