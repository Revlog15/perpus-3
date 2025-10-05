// pinjam_buku.js
// Simple module exporting loans and returns arrays so loan data is separated

const loans = [
  {
    id: "L001",
    idBuku: "B001",
    idUser: "U001",
    nama: "Andiva",
    tanggalPinjam: "2024-01-15",
    tanggalKembali: "2024-01-22",
    status: "aktif",
    terlambat: false
  },
  {
    id: "L002",
    idBuku: "B014",
    idUser: "U001",
    nama: "Andiva",
    tanggalPinjam: "2024-01-20",
    tanggalKembali: "2024-01-27",
    status: "aktif",
    terlambat: false
  }
];

const returns = [
  {
    id: "R001",
    idBuku: "B002",
    idUser: "U001",
    nama: "Andiva",
    tanggalPinjam: "2024-01-01",
    tanggalKembali: "2024-01-08",
    tanggalPengembalian: "2024-01-08",
    denda: 0,
    status: "selesai"
  }
];

module.exports = { loans, returns };
