# Riwayat Perubahan

## v0.3.1

Audit mendalam dan optimalisasi pada fitur yang sudah ada.

### Perbaikan bug

- **Transaksi preorder ganda.** Dua permintaan penyelesaian bersamaan kini menghasilkan satu penjualan. Baris preorder dikunci dan `penjualan.preorder_id` dibuat unik.
- **Snapshot preorder.** Nama dan harga yang dipakai saat preorder diselesaikan berasal dari data pesanan, bukan harga menu terkini.
- **Stok saat transaksi bersamaan.** Pemotongan memakai syarat stok mencukupi, sehingga kegagalan menghasilkan pesan yang jelas, bukan galat server.
- **Kategori dan satuan.** Pilihan admin kini mencakup semua nilai yang dipakai data contoh, sehingga menu dan bahan bisa diubah lewat antarmuka.
- **Menu baru tampil.** Daftar kategori dan filter di halaman konsumen diambil dari data sebenarnya.
- **Muat ulang contoh.** Urutan penghapusan disesuaikan dengan relasi preorder dan penjualan.
- **Filter laporan.** Tanggal divalidasi, dan permintaan tidak lagi dobel saat menekan Terapkan.
- **Sesi habis.** Halaman admin mengalihkan ke login bila respons API berstatus 401.

### Peningkatan

- **Muat menu jauh lebih cepat.** Semua resep diambil dalam satu kueri dan menu langsung dirender dari server. Halaman tidak lagi menunggu fetch awal.
- **Lebih ringan.** Daftar preorder dan transaksi memakai satu kueri lalu dikelompokkan di memori, bukan satu kueri per baris.
- **Batas jumlah kasir.** Jumlah dibatasi 1 sampai 100 di antarmuka agar sesuai dengan validasi server.
- **Tanpa label prototipe.** Catatan prototipe dan PIN demo dihapus dari antarmuka.
- **Aksesibilitas.** Label tombol jumlah menyebut nama menu dan filter status memakai `aria-pressed`.

## v0.3.0

Menu Warung Kak Ikaa dimasukkan lengkap dan tampilan konsumen disederhanakan agar lebih mudah dipakai.

### Fitur baru

- **Menu lengkap.** 33 item dari lima kategori: Mie Jebew, Wonton Ayam Chili Oil, Mie Chili Oil, Extra Topping, dan Minuman.
- **Filter dan pencarian.** Pelanggan bisa memilih kategori atau mencari nama menu langsung di halaman.
- **Muat ulang contoh.** Perintah `npm run muat:contoh` mengganti seluruh data demo dengan isi `seed.sql` terbaru.

### Peningkatan

- **Tampilan lebih jelas.** Informasi harga, status, dan sisa porsi dipisah dengan rapi di setiap kartu menu.
- **Animasi ringan.** Transisi kartu dan dialog memakai CSS murni, tanpa pustaka tambahan.
- **Total langsung.** Form pre-order menampilkan total yang berubah saat jumlah diubah.
- **Petunjuk level pedas.** Pelanggan diingatkan menuliskan level 0 sampai 3 di kolom catatan.

### Penggunaan

Jalankan `npm run muat:contoh` sekali untuk memasang menu terbaru ke Supabase, lalu buka website konsumen.

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
