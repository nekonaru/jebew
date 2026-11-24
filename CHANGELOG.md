# Riwayat Perubahan

## final-v1.0.6

Penyempurnaan tipografi dan detail visual website konsumen.

### Peningkatan

- **Tipografi profesional.** Judul memakai Playfair Display dan isi memakai Plus Jakarta Sans. Keduanya di-host bersama aplikasi sehingga tidak bergantung pada jaringan saat dipakai.
- **Aksen kategori.** Tiap kategori menu punya warna pembeda yang konsisten pada garis kecil dan label, sehingga daftar lebih mudah dipindai.
- **Umpan balik keranjang.** Lencana jumlah keranjang berdenyut halus saat bertambah dan bilah keranjang muncul dengan transisi lembut.
- **Kontras terjaga.** Seluruh warna label kategori memenuhi ambang kontras 4,5 banding 1.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.5

Alur pemesanan diubah menjadi keranjang.

### Peningkatan

- **Klik untuk menambah.** Setiap kartu menu punya tombol Tambah. Menu dengan varian membuka pilihan varian singkat sebelum masuk keranjang.
- **Keranjang pesanan.** Ikon keranjang di header menampilkan jumlah item. Bilah ringkas muncul hanya bila ada pesanan dan berisi total serta tombol Isi data pesanan.
- **Data diisi di akhir.** Form nama, WhatsApp, waktu ambil, dan catatan hanya muncul setelah pelanggan selesai memilih menu.
- **Keranjang bisa diubah.** Jumlah tiap item bisa dinaikkan, diturunkan, atau dihapus sebelum dikirim.
- **Tampilan lebih rapi.** Tombol aksi tidak lagi mengambang permanen, kartu punya satu target klik yang jelas, dan hierarchy teks diperbaiki.

### Perbaikan bug

- Target sentuh tombol Tambah dan tombol jumlah keranjang memenuhi ukuran minimum.
- Label tombol kartu tidak lagi menimbulkan ketidaksesuaian nama aksesibel.

## final-v1.0.4

Perbaikan tata letak website konsumen dan fungsi pemesanan.

### Perbaikan bug

- **Tombol admin dihilangkan.** Konsumen tidak lagi melihat tautan dashboard dari website publik.
- **Tombol pre-order dipindahkan.** Tidak lagi mengambang di bawah layar. Sekarang tersedia di area sambutan dan di samping judul Menu hari ini.
- **Info jam operasional.** Status Buka atau Tutup bisa disorong untuk melihat hari dan jam buka, termasuk lewat keyboard.
- **Pilih menu berfungsi.** Setiap kartu menu punya tombol Pesan yang membuka form dengan menu tersebut sudah terpilih.
- **Label formulir.** Select pada form pre-order kini punya label yang terbaca pembaca layar.

### Peningkatan

- Pengaturan hari buka ditambahkan ke panel admin dan data contoh.

## final-v1.0.3

Identitas Mie Jebew diperkuat dan tautan kedua versi ditambahkan ke README.

### Peningkatan

- **Tautan demo.** README menampilkan tautan langsung ke prototipe dan produk jadi, beserta akun masuk masing-masing.
- **Identitas merek.** Header memakai wordmark Mie Jebew dengan sub-label Chili Oil dan Wonton. Judul halaman, panel admin, dan footer memakai penamaan yang konsisten.
- **Tanda tangan visual.** Tanda Jebew muncul sebagai latar halus pada area sambutan.
- **Animasi bertahap.** Elemen sambutan muncul berurutan, dan bagian tertentu memakai animasi gulir native dengan perlindungan untuk browser lama.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.2

Penyempurnaan visual pada website konsumen.

### Peningkatan

- **Hero editorial.** Area sambutan memakai tata letak dua kolom dengan kartu ringkasan status hari ini, bukan blok warna polos.
- **Bilah informasi.** Jam buka, lacak pesanan, dan pesan cepat disatukan dalam satu bilah dengan ikon dan pemisah yang rapi.
- **Kartu menu.** Kategori, status, deskripsi, varian, dan harga punya hierarki yang jelas. Harga ditempatkan pada bilah bawah kartu.
- **Detail kecil.** Garis aksen di header, ikon pencarian, keterangan bagian, keadaan kosong yang informatif, dan footer yang lebih tertata.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.1

Penyempurnaan desain, keamanan, dan kecepatan pada versi final.

### Peningkatan

- **Desain lebih rapi.** Token warna, ruang, dan gerak tersusun dalam satu tempat. Kontras teks memenuhi 4,5 banding 1, dan hierarki judul diperbaiki.
- **Animasi halus.** Transisi 120 sampai 320 ms memakai `transform` dan `opacity` saja, dengan `@starting-style` untuk dialog dan pengurangan gerak penuh.
- **Lebih ringan.** Daftar panjang memakai `content-visibility`, animasi tidak menyentuh properti tata letak, dan tidak ada pustaka animasi tambahan.
- **Keamanan diperkuat.** Pembatasan laju login dan pre-order kini tersimpan di database sehingga tetap bekerja lintas instance serverless. Header HSTS, COOP, dan kebijakan cross-domain ditambahkan di produksi.
- **Audit bersih.** Lighthouse mencatat 100 untuk aksesibilitas, praktik terbaik, dan SEO pada halaman konsumen maupun login.

### Penggunaan

Tidak ada perubahan cara pakai. Jalankan `npm run siap:supabase` sekali untuk menambah tabel pembatasan laju.

## final-v1.0.0

Produk jadi Tahap 2 untuk Warung Kak Ikaa. Dikembangkan pada cabang `final` dan berdampingan dengan prototipe `v0.3.1` pada cabang `main`.

### Fitur baru

- **Login dan peran.** Autentikasi email dan kata sandi dengan hash scrypt, sesi bertanda tangan, serta peran Pemilik dan Kasir.
- **Audit log.** Setiap perubahan menu, stok, dan transaksi tercatat dengan nama pengguna dan waktu.
- **Stok lengkap.** Riwayat pergerakan, pembelian dari supplier, harga rata rata, stock opname, dan konversi satuan.
- **Keuangan.** HPP per menu, margin, pengeluaran berkategori, laporan laba kotor dan bersih, grafik tren, ekspor CSV, dan tutup kasir.
- **Varian menu.** Level pedas dan topping dengan harga serta resep sendiri.
- **Pre-order penuh.** Slot waktu dengan kuota, kode lacak, halaman pelacakan, dan pesan WhatsApp terformat ke nomor warung.
- **Pengaturan usaha.** Identitas toko, jam operasional, status buka tutup, kelola pengguna, dan kelola slot.
- **Tampilan profesional.** Sistem desain baru dengan tipografi, warna, komponen, dan animasi halus yang konsisten.

### Peningkatan

- Kueri database dikelompokkan agar halaman cepat, dengan cache 10 detik untuk data publik.
- Semua perubahan stok memakai transaksi dan pembaruan bersyarat untuk mencegah stok negatif.
- Dokumentasi, skema, dan data contoh disusun ulang untuk versi final.

### Penggunaan

Hubungkan cabang `final` ke project Vercel tersendiri dengan Supabase final. Jalankan `npm run siap:supabase`, isi environment variables, lalu buka website konsumen dan dashboard admin.

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

- **Muat menu jauh lebih cepat.** Semua resep diambil dalam satu kueri, menu langsung dirender dari server, dan data publik disimpan dalam cache 10 detik. Halaman tidak lagi menunggu fetch awal.
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
