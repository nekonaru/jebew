# Riwayat Perubahan

## v0.1.0

Prototipe Tahap 1 untuk tugas PBL yang menghadirkan dashboard admin dan website konsumen dalam satu aplikasi.

### Fitur baru

- **Dashboard admin.** Kelola bahan baku, menu, dan resep dengan perhitungan porsi otomatis.
- **Kasir atomik.** Catat penjualan dengan pengecekan stok dan pengurangan stok dalam satu transaksi.
- **Laporan harian.** Tampilkan omzet, jumlah transaksi, menu terlaris, dan daftar transaksi dengan filter tanggal.
- **Pre-order.** Terima pesanan dari website dan kirim rinciannya ke WhatsApp admin.
- **Website konsumen.** Tampilkan status Tersedia atau Habis yang diperbarui setiap 15 detik.
- **Data contoh.** Sediakan tiga menu dan enam bahan Mie Jebew untuk keperluan demo.

### Peningkatan

- **Database lokal.** Pakai SQLite bawaan Node.js agar aplikasi jalan tanpa akun cloud.
- **Validasi server.** Periksa semua masukan dengan Zod dan tolak field yang tidak dikenal.
- **Audit dependensi.** Perbaiki seluruh temuan audit dengan versi dependensi terbaru.

### Penggunaan

Jalankan `npm ci`, salin `.env.example` ke `.env.local`, lalu jalankan `npm run dev` dan buka `http://localhost:3000`.
