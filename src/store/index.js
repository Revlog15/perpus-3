const path = require('path');
const { readJsonSafeSync, writeJsonAtomicSync } = require('../lib/storage');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const booksJsonPath = path.join(ROOT_DIR, 'data', 'data_buku.json');
const usersJsonPath = path.join(ROOT_DIR, 'data', 'data_login.js');
const loansJsonPath = path.join(ROOT_DIR, 'data', 'data_loans.json');
const returnsJsonPath = path.join(ROOT_DIR, 'data', 'data_returns.json');

const store = {
  books: readJsonSafeSync(booksJsonPath, []),
  users: readJsonSafeSync(usersJsonPath, []),
  loans: readJsonSafeSync(loansJsonPath, []),
  returns: readJsonSafeSync(returnsJsonPath, []),
  paths: {
    booksJsonPath,
    usersJsonPath,
    loansJsonPath,
    returnsJsonPath,
  },
  saveBooks() { writeJsonAtomicSync(booksJsonPath, store.books); },
  saveUsers() { writeJsonAtomicSync(usersJsonPath, store.users); },
  saveLoans() { writeJsonAtomicSync(loansJsonPath, store.loans); },
  saveReturns() { writeJsonAtomicSync(returnsJsonPath, store.returns); },
};

module.exports = store;


