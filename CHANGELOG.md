# Riwayat Perubahan

## v0.2.0

Prototipe Tahap 1 kini memakai Supabase Postgres dan siap dideploy ke Vercel.

### Fitur baru

- **Database Supabase.** Seluruh data tersimpan di Postgres. Skema dan seed disiapkan lewat `npm run siap:supabase`.
- **Skrip penyiap.** `siap:supabase` memasang tabel dan data contoh tanpa perlu menempel SQL manual.
- **Penolakan env kosong.** Produksi gagal dengan pesan jelas bila `ADMIN_PIN` atau `RAHASIA_SESI` belum diisi.

### Peningkatan

- **Lapisan data async.** Transaksi memakai koneksi Postgres yang sama lewat `AsyncLocalStorage`, sehingga atomikitas tetap terjaga.
- **Waktu WIB.** Nilai tanggal Postgres disamakan dengan format lama agar laporan harian tidak berubah.
- **Dokumentasi deploy.** README, panduan demo, dan variabel lingkungan diperbarui untuk alur Supabase dan Vercel.

### Penggunaan

Buat project Supabase, isi `DATABASE_URL` di `.env.local`, jalankan `npm run siap:supabase`, lalu `npm run dev`.

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
