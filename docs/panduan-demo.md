# Panduan Demo Prototipe

Panduan ini dipakai untuk menunjukkan alur utama Jebew dalam waktu lima menit. Semua langkah memakai data contoh yang dibuat otomatis saat aplikasi pertama dijalankan.

## Persiapan

1. Pastikan project Supabase sudah aktif dan `DATABASE_URL` terisi di `.env.local`
2. Jalankan `npm run siap:supabase` untuk memasang tabel. Bila data lama masih ada, jalankan `npm run muat:contoh` agar menu terbaru terpasang
3. Jalankan `npm ci` lalu `npm run dev`
4. Buka `http://localhost:3000` di browser
5. Buka tab lain ke `http://localhost:3000/admin/login` dan masukkan PIN yang kamu atur
6. Pastikan kedua tab terbuka berdampingan supaya perubahan status mudah dilihat

## Skenario lima menit

### Menit pertama: kondisi awal

Tampilkan website konsumen dengan 33 menu Warung Kak Ikaa. Coba filter kategori **Minuman**, lalu kolom cari dengan kata "dumpling", lalu kembalikan ke **Semua**. Tunjukkan Mie Jebew Original berstatus **Tersedia** dengan keterangan **Sisa 8 porsi**. Jelaskan bahwa angka itu dihitung dari stok mie 2.000 gram, bumbu chili oil 120 gram, dan telur 60 butir. Bumbu menjadi penghambat karena hanya cukup untuk delapan porsi.

### Menit kedua: menu dan resep

Buka halaman **Menu & resep** di dashboard. Tunjukkan kartu Mie Jebew Original beserta resepnya dan tulisan bahwa bumbu adalah bahan penghambat. Jelaskan bahwa mengubah jumlah resep akan langsung mengubah angka porsi.

### Menit ketiga: catat penjualan

Buka halaman **Kasir**, pilih Mie Jebew Original, masukkan jumlah delapan, lalu simpan transaksi. Tunjukkan pesan bahwa stok berhasil dikurangi. Kembali ke tab website dan klik **Segarkan status**. Menu berubah menjadi **Habis**.

### Menit keempat: laporan dan restock

Buka halaman **Laporan**. Tampilkan omzet Rp80.000 dari satu transaksi. Kembali ke **Bahan baku**, tekan **Tambah stok** pada Bumbu Chili Oil, lalu isi seratus gram. Segarkan tab website. Mie Jebew Original kembali **Tersedia** dengan sisa enam porsi.

### Menit kelima: pre-order

Dari tab website, klik **Buat pre-order**, pilih Es Teh dua gelas, isi nama dan nomor WhatsApp, tentukan waktu ambil, lalu kirim. Tunjukkan pesan yang sudah rapi dan tombol **Buka WhatsApp admin**. Tekan tombol itu untuk membuka wa.me dengan pesan siap kirim.

Terakhir, buka halaman **Pre-order** di dashboard. Tunjukkan pesanan baru masuk. Tekan **Selesaikan** untuk menunjukkan bahwa penjualan tercatat dan stok berkurang.

## Kriteria berhasil

Demo dianggap berhasil bila kelima hal ini terlihat:

- Jumlah porsi awal delapan dengan bumbu sebagai penghambat
- Transaksi delapan porsi berhasil disimpan
- Website berubah dari Tersedia menjadi Habis tanpa mengubah kode
- Restock bumbu mengembalikan status menjadi Tersedia
- Tautan WhatsApp terbuka dengan rincian pesanan dan total yang benar

## Keterbatasan prototipe

- Belum ada autentikasi penuh dan pembagian peran. Dashboard hanya dilindungi satu PIN.
- Pembayaran online, QRIS, dan notifikasi WhatsApp otomatis belum dibuat. Pre-order memakai tautan wa.me.
- Belum ada riwayat pergerakan stok, HPP, laba rugi, stock opname, atau ekspor laporan.
- Database memakai satu project Supabase. Pemakaian multi-cabang dan multi-usaha belum didukung.
- Status menu diperbarui dengan permintaan berkala setiap 15 detik, bukan realtime.
- Belum ada pengujian antarmuka otomatis. Pengujian yang ada mencakup logika inti dan alur data lewat API.
- Demo memerlukan koneksi internet dan project Supabase yang aktif.
- Deploy ke Vercel mengikuti langkah di README. Pastikan seluruh variabel lingkungan produksi terisi sebelum aplikasi diakses publik.
