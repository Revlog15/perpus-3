const { query } = require('./index');

async function list({ userId } = {}) {
  let sql = 'SELECT * FROM payments';
  const params = [];
  if (userId) {
    sql += ' WHERE idUser = ?';
    params.push(userId);
  }
  return query(sql, params);
}

async function create(payment) {
  const {
    id,
    returnId = null,
    loanId = null,
    idUser,
    nama,
    amount,
    paymentMethod = 'cash',
    tanggalBayar,
    status = 'completed',
    type = null,
  } = payment;

  await query(
    `INSERT INTO payments 
     (id, returnId, loanId, idUser, nama, amount, paymentMethod, tanggalBayar, status, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, returnId, loanId, idUser, nama, amount, paymentMethod, tanggalBayar, status, type]
  );
  return { ...payment };
}

module.exports = {
  list,
  create,
};





