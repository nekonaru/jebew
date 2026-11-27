# Riwayat Perubahan

## final-v5.1.0

Pengiriman, pembayaran, dan loyalitas yang lebih lengkap.

### Fitur baru

- **Zona kirim.** Pemilik membuat zona beserta tarif. Pelanggan memilih zona saat pesanan dikirim dan ongkir dihitung server.
- **Unggah bukti transfer.** Pelanggan mengunggah gambar kecil setelah pesanan dibuat. Bukti tersimpan pada pesanan.
- **QRIS statis.** Pemilik mengisi teks rekening atau URL gambar QRIS. Informasi tampil di checkout saat metode QRIS dipilih.
- **Pesan dari meja.** Halaman `/meja/[nomor]` mengarah ke pemesanan dengan nomor meja terisi otomatis.
- **Persetujuan purchase order.** Purchase order berstatus draft kini dikirim ke supplier sebelum diterima.
- **Manfaat tingkat loyalitas.** Pelanggan Silver, Gold, dan Platinum mendapat diskon otomatis 2, 3, dan 5 persen.

### Perbaikan

- **Alur kirim lebih jelas.** Zona kirim, alamat, dan ongkir ditampilkan di ringkasan sebelum konfirmasi.

## final-v5.0.0

Penjualan lanjutan dan operasional yang lebih terukur.

### Fitur baru

- **Diskon bundling.** Pemilik mengaktifkan diskon otomatis untuk jumlah porsi minimum tertentu.
- **Batas batal otomatis.** Pemilik menentukan berapa menit setelah waktu ambil pesanan dibatalkan otomatis.
- **Piutang pelanggan.** Tagihan, jatuh tempo, pembayaran sebagian, dan status lunas tersedia di Fitur lanjutan.
- **Shift staf.** Mulai dan selesaikan shift beserta kas awal dan kas akhir.
- **Catatan limbah.** Bahan rusak dicatat dengan alasan dan langsung mengurangi stok.
- **Halaman promo publik.** Daftar promo aktif bisa dibuka pengunjung tanpa masuk.
- **Halaman menu per item.** Setiap menu punya halaman sendiri dengan metadata dan Open Graph untuk dibagikan.
- **Panggilan pelanggan.** Layar dapur bisa menandai pesanan yang sedang dipanggil.

### Perbaikan

- **Skrip uji lebih tahan versi.** Pemeriksaan health kini menerima semua rilis mayor dari v4 ke atas.

## final-v4.2.0

Penyelesaian alur dapur dan konsumen.

### Fitur baru

- **Layar dapur penuh.** Halaman `/layar-dapur` menampilkan pesanan besar dengan hitung mundur dan aksi satu klik, cocok untuk layar di area masak. Halaman ini hanya untuk pengguna yang masuk.
- **Kalkulator harga jual.** Pemilik menghitung harga disarankan dari HPP dan margin target di halaman Fitur lanjutan.
- **Checklist harian.** Enam tugas buka dan tutup warung tersimpan per tanggal di perangkat.
- **Kartu member digital.** Halaman lacak menampilkan tingkat, saldo poin, total belanja, dan kode undangan pelanggan.
- **Bagikan menu.** Pengunjung bisa membagikan atau menyalin tautan menu tertentu.

### Perbaikan

- **Laporan lebih rapi.** Ringkasan kini menampilkan target, checklist, dan panduan dalam kartu terpisah sehingga tidak saling menimpa.

## final-v4.1.0

Penjualan multikanal ringan, batch bahan, dan otomatisasi pengingat.

### Fitur baru

- **Minimum preorder.** Pemilik menetapkan minimum rupiah pesanan. Pesanan di bawah minimum ditolak server.
- **Biaya kirim.** Biaya kirim diatur dari Pengaturan dan otomatis masuk ke total pesanan bertipe kirim.
- **Metode bayar.** Pelanggan memilih tunai, QRIS, atau transfer. Nomor referensi transfer tampil di pesan WhatsApp.
- **Batch bahan.** Pemilik menambah batch dengan tanggal masuk dan kedaluwarsa. Potongan stok memakai batch terdekat kedaluwarsa lebih dulu.
- **Target versus realisasi.** Ringkasan pemilik menampilkan progres omzet dan transaksi terhadap target harian.
- **Pengingat otomatis.** Endpoint Cron mengirim pengingat ambil untuk pesanan besok dengan proteksi token.
- **Service worker.** Shell aplikasi dapat dipasang dan dibuka kembali saat jaringan terputus.

### Perbaikan

- **Pesan WhatsApp lebih lengkap.** Subtotal, ongkir, total bayar, jenis pesanan, dan metode bayar kini tercantum.
- **Stok batch konsisten.** Penambahan batch langsung menambah stok bahan dan tercatat di riwayat.
- **Auto-batal aman.** Endpoint pembatalan otomatis kini menerima token Cron atau Izinkan pemilik.

## final-v4.0.0

Fondasi platform Jebew v4: peran kerja, keamanan akun, profil usaha, dan penjualan lebih fleksibel.

### Fitur baru

- **Peran dapur.** Staf dapur hanya melihat menu, stok, preorder, dan papan dapur. Halaman keuangan tidak tersedia untuk peran ini.
- **Verifikasi dua langkah.** Pemilik dan staf dapat mengaktifkan TOTP dari halaman Keamanan. Login meminta kode enam angka bila 2FA aktif.
- **Kelola sesi aktif.** Halaman Keamanan menampilkan perangkat yang masuk dan tombol untuk mencabut sesi tertentu.
- **Profil usaha lengkap.** Alamat, tautan peta, deskripsi, email, Instagram, URL logo, dan banner beranda diatur dari Pengaturan.
- **Mode pemeliharaan.** Pemilik dapat menyembunyikan website konsumen sementara tanpa mengubah data.
- **Tentang Kami.** Deskripsi dan kontak usaha tampil di beranda bila diisi.
- **Jenis pesanan.** Pelanggan memilih ambil di warung, makan di tempat dengan nomor meja, atau dikirim dengan alamat tujuan.
- **Poin dan tingkat loyalitas.** Saldo poin kini disertai tingkat Reguler, Silver, Gold, atau Platinum.
- **Kode undangan.** Pelanggan yang mengundang teman mendapat tambahan poin setelah pesanan teman selesai.
- **Ulasan publik.** Ulasan yang disetujui tampil di beranda bersama rating bintang.
- **PWA dan SEO.** Manifest aplikasi, robots, sitemap, metadata Open Graph, dan warna tema ditambahkan.
- **Auto-batal preorder.** Pemilik dapat membatalkan pesanan yang sudah lewat waktu ambil dengan satu tombol.

### Perbaikan

- **Validasi server untuk dine-in dan kirim.** Nomor meja dan alamat kirim wajib diisi di server, bukan hanya di browser.
- **Sesi tercatat.** Setiap login membuat sesi aktif yang bisa dicabut satu per satu.
- **Muat contoh lengkap.** Penghapusan data contoh kini mencakup sesi, 2FA, dan tabel profil baru.

## final-v3.2.0

Pendalaman pengalaman: identitas visual, pemilihan waktu, validasi, dan alur kerja yang lebih cepat.

### Fitur baru

- **Ilustrasi hero lokal.** Ilustrasi mie dan chili oil berbasis SVG lokal, tanpa ketergantungan gambar luar jaringan.
- **Foto menu.** Menu yang memiliki foto kini menampilkannya di kartu dengan rasio tetap dan pemuatan malas.
- **Kalender ambil.** Tanggal dan jam pre-order dipilih lewat tombol tanggal dan grid slot, bukan daftar drop-down.
- **Langkah periksa pesanan.** Checkout memuat ringkasan akhir dan konfirmasi wajib sebelum pesanan dikirim.
- **Draft lokal.** Nama, WhatsApp, catatan, promo, poin, dan waktu tersimpan otomatis di perangkat hingga pesanan berhasil.
- **Validasi kolom.** Galat ditampilkan di dekat kolom, dengan fokus otomatis ke kolom pertama yang bermasalah.
- **Pusat notifikasi di panel.** Jumlah notifikasi tertunda ditampilkan di header dan tautan mengarah ke papan dapur.
- **Panduan pertama kali.** Checklist empat langkah di ringkasan membantu pemilik menyiapkan warung.

### Perbaikan

- **Hitung mundur dapur.** Tiap kartu menunjukkan sisa waktu ambil dan penanda mendesak saat kurang dari 30 menit.
- **Urungkan status.** Penandaan siap dapat dibatalkan langsung dari papan dapur.
- **Cetak label.** Kartu pesanan bisa dicetak menjadi label berisi kode, pelanggan, waktu ambil, dan rincian menu.
- **Perpindaan halaman.** View Transitions API dipakai bila browser mendukung, dengan penghormatan `prefers-reduced-motion`.
- **Kontras badge.** Badan menu habis memakai teks yang lebih gelap agar lolos pemeriksaan kontras.
- **Polling lebih ringan.** Penyegaran beranda dan dapur dijalankan hanya saat tab terlihat.
- **Muat contoh lengkap.** `npm run muat:contoh` kini menghapus seluruh tabel fitur lanjutan sebelum memuat data contoh, sehingga tidak lagi gagal karena kunci asing baru.

## final-v3.1.0

Pembaruan desain, animasi, alur, dan aksesibilitas tanpa mengubah data.

### Fitur baru

- **Sistem token desain.** Warna semantik, bayangan tiga tingkat, radius, dan tiga durasi gerak dipakai konsisten di konsumen dan panel.
- **Pencarian cepat panel.** Tombol Cari halaman dan pintasan `Ctrl+K` atau `Cmd+K` untuk lompat ke halaman mana pun.
- **Navigasi berkelompok.** Menu panel dikelompokkan menjadi Utama, Operasional, Keuangan, dan Pengaturan, dengan bilah navigasi bawah di ponsel.
- **Penanda langkah checkout.** Stepper tiga langkah menggantikan teks datar di formulir pemesanan.
- **Placeholder memuat.** Skeleton dipakai saat data ringkasan dan papan dapur masih dimuat, sehingga tidak menampilkan kondisi kosong palsu.
- **Tautan lompat.** Tautan "Lompat ke konten utama" tersedia untuk pengguna keyboard di semua halaman.
- **Status penyegaran.** Beranda konsumen menampilkan jam data terakhir diperbarui.

### Perbaikan

- **Animasi bermakna.** Toast, sukses, kartu papan dapur, dan langkah checkout memakai animasi singkat dengan arah dan easing yang konsisten.
- **Header tabel sticky.** Judul kolom tetap terlihat saat daftar panjang digulir.
- **Polling hemat.** Penyegaran 15 detik dijalankan hanya saat tab browser terlihat.
- **Kontras dan fokus.** Semua kontrol memakai cincin fokus yang sama dan tombol tutup dialog memakai ukuran sentuh penuh.
- **Dapur lebih rapi.** Pesanan diurutkan berdasarkan waktu ambil dan diberi penanda jika kurang dari 30 menit menjelang pengambilan.
- **Gerak dikurangi.** Semua animasi otomatis disederhanakan saat pengguna meminta `prefers-reduced-motion`.

## final-v3.0.0

Pembaruan besar pertama untuk Jebew v3: dapur terhubung, promosi dan loyalitas, jadwal per hari, serta stok lanjutan.

### Fitur baru

- **Papan dapur.** Pesanan tampil dalam tiga kolom: baru, diproses, dan siap. Ada timer sejak pesanan masuk, aksi satu klik, serta catatan pelanggan.
- **Status siap.** Preorder kini punya tahap siap sebelum selesai. Setiap perubahan status tercatat dan memicu notifikasi WhatsApp.
- **Notifikasi WhatsApp otomatis.** Pesan dibuat otomatis saat status berubah. Bila WhatsApp Business API belum terpasang, tautan `wa.me` tetap tersedia untuk admin.
- **Promo dan kupon.** Pemilik membuat kode promo nominal atau persen, kuota, minimum belanja, dan masa berlaku. Pelanggan memakai kode di checkout.
- **Poin loyalitas.** Seribu rupiah setara satu poin. Seratus poin bisa ditukar menjadi diskon lima ribu rupiah.
- **Ulasan pelanggan.** Pelanggan mengirim rating dan komentar memakai kode lacak. Pemilik meninjau sebelum ulasan tampil.
- **Estimasi dan antrean.** Halaman lacak menampilkan jumlah pesanan aktif, perkiraan waktu siap, dan riwayat status lengkap.
- **Favorit dan rekomendasi.** Pelanggan bisa menyimpan menu favorit di perangkat dan melihat menu yang sering dipesan bersamaan.
- **Pesanan besar.** Checkout punya pilihan pesanan besar dengan batas minimal sepuluh porsi untuk kebutuhan katering.
- **Jadwal per hari.** Pemilik menentukan jam toko dan jam pre-order untuk tiap hari serta menambah hari libur. Jadwal ini menggantikan jam umum.
- **Target harian.** Pemilik menetapkan target omzet dan target transaksi per tanggal.
- **Stok lanjutan.** Prediksi hari sebelum bahan habis, riwayat harga supplier, purchase order, dan penerimaan purchase order yang langsung menambah stok.
- **Health check.** Endpoint `/api/health` untuk pemantauan kesiapan aplikasi dan database.

### Perbaikan

- **Detail checkout lengkap.** Total bayar menampilkan diskon promo dan poin sebelum tombol kirim.
- **Slot dikelompokkan.** Pilihan waktu ambil dikelompokkan menurut tanggal agar mudah dibaca.
- **Halaman preorder mengikuti tahap baru.** Filter dan aksi tersedia untuk status siap.
- **Migrasi otomatis.** Penyiapan database kini menjalankan skema dan migrasi sekaligus, termasuk tabel baru tanpa menghapus data lama.

## final-v2.13.0

Pembaruan besar: otomatisasi slot, kemudahan pelanggan, dan penguatan keamanan serta aksesibilitas.

### Fitur baru

- **Slot massal.** Pemilik membuat banyak slot sekaligus dari rentang tanggal, jam mulai, jam selesai, interval, kuota, dan hari yang dipilih, lengkap dengan pratinjau jumlah.
- **Hapus slot.** Slot yang belum dipakai pesanan aktif bisa dihapus dari Pengaturan.
- **Pesan lagi.** Dari halaman lacak, pelanggan memasukkan menu yang sama ke keranjang dengan satu klik.
- **Ingat kontak.** Pelanggan bisa menyimpan nama dan WhatsApp di perangkat secara sukarela untuk pesanan berikutnya.
- **Antrean lacak.** Halaman lacak menunjukkan jumlah pesanan aktif sebelum pesanan yang dicari.

### Perbaikan keamanan

- **Sesi tercabut.** Mengganti kata sandi, mengubah peran, menonaktifkan akun, atau keluar mencabut token lama. Setiap login memakai nonce baru.
- **Body terukur.** Seluruh endpoint menerima body dengan penghitung byte nyata, bukan hanya `Content-Length`.
- **Cadangan divalidasi.** Nilai pada berkas pemulihan dibatasi tipe dan rentangnya sebelum ditulis.
- **Endpoint berat dibatasi.** Ekspor, laporan, dan riwayat memakai pembatas laju per pengguna.
- **Kata sandi minimal delapan karakter.** Aturan disamakan di server dan tampilan.

### Perbaikan lain

- **Fokus terlihat.** Cincin fokus input tidak lagi ditimpa bayangan lemah.
- **Grafik terbaca.** Nilai per hari tersedia untuk pembaca layar tanpa `role="img"` bertingkat.
- **Laporan stabil.** Permintaan laporan memakai penjaga urutan dan membatasi 100 baris tampilan.
- **Konfirmasi konsisten.** Hapus menu dan master data memakai dialog aplikasi, bukan `confirm` bawaan browser.
- **Label terasosiasi.** Baris resep, varian, pembelian, dan opname memakai `htmlFor` dan `id`.
- **HPP terkunci.** HPP dihitung dari harga bahan yang sudah dikunci saat stok dipotong.
- **Kuota aman.** Kuota slot tidak boleh lebih kecil dari pesanan yang sudah terdaftar.
- **Aksesibilitas dan konsistensi.** Tombol lacak dinonaktifkan saat kode kosong, estimasi stok tidak menampilkan kondisi aman saat data masih dimuat, format waktu diseragamkan, dan tautan website memakai navigasi klien.

## final-v2.12.0

Jadwal toko dan pre-order yang terpisah, plus tombol status cepat untuk pemilik.

### Fitur baru

- **Jadwal terpisah.** Pemilik mengatur jam toko dan jam pre-order secara berbeda, termasuk opsi siap menerima pre-order.
- **Tombol status cepat.** Pemilik membuka atau menutup toko dan pre-order langsung dari ringkasan tanpa membuka pengaturan.
- **Status operasional di website.** Pengunjung melihat status toko dan status pre-order di header beserta keterangan jamnya.
- **Pre-order mengikuti jadwalnya.** Pesanan ditolak saat pre-order ditutup, meskipun toko sedang buka.

### Perbaikan

- **Perubahan langsung tampil.** Status dihitung setiap permintaan dan cache diinvalidasi saat jadwal diubah.
- **Rentang hari aman.** Format hari divalidasi dan parser gagal tertutup untuk teks yang tidak dikenal.
- **Toggle sesuai flag.** Tombol status memakai flag aktif, bukan gabungan flag dan jam, sehingga tidak ada klik yang sia-sia.
- **Jam fleksibel.** Rentang lintas tengah malam dan jam sama kini didukung konsisten di validator dan mesin jadwal.
- **Pengujian jadwal.** Empat fungsi jadwal mendapat pengujian unit untuk WIB, tengah malam, dan status berdiri sendiri.

## final-v2.11.0

Perbaikan menyeluruh pada alur pemesanan konsumen.

### Perbaikan

- **Formulir langsung terbuka.** Tombol "Isi data pesanan" tidak lagi memblokir dialog karena kolom waktu berada di dalam formulir.
- **Formulir lebih jelas.** Dialog diberi judul langkah, rincian data diri dan waktu dipisah, serta ada petunjuk format WIB yang benar.
- **Slot kedaluwarsa ditangani.** Bila slot hilang saat formulir dibuka, pelanggan diminta memilih ulang atau mengisi waktu manual dengan pesan yang jelas.
- **Validasi dipindah ke submit.** Waktu ambil diperiksa saat mengirim, sehingga pesan galat muncul di dalam formulir.
- **Pelacakan lebih jelas.** Tombol Cek status dinonaktifkan bila kode kosong, dan dialog sukses memuat tautan langsung ke pelacakan.
- **Status toko konsisten.** Badge menu menunjukkan "Toko tutup" saat toko tidak buka, dengan tombol yang menjelaskan alasannya.
- **Contoh waktu memakai WIB.** Placeholder tanggal dan opsi slot tidak lagi mengarah ke tanggal UTC yang salah.
- **FAQ diperbarui.** Cara memesan menyebut waktu ambil dan tombol isi data.

## final-v2.10.0

Audit putaran kedua puluh enam dan alur cadangan yang seimbang.

### Fitur baru

- **Salin kode di dialog sukses.** Pelanggan bisa langsung menyalin kode lacak setelah pesanan dibuat.

### Perbaikan

- **Nomor WhatsApp dinormalisasi.** Nomor lokal `08...` kini diterjemahkan ke format `wa.me/62...` untuk tautan admin maupun pelanggan.
- **Ekspor sesuai batas pemulihan.** Tiap tabel dibatasi 10.000 baris dan berkas memuat daftar tabel yang dipotong, sehingga cadangan yang diunduh tetap bisa dipulihkan.
- **Pemulihan memakai SERIALIZABLE.** Transaksi yang bentrok saat pemulihan gagal dengan pesan yang jelas, bukan data yatim.
- **Dialog sukses lebih lengkap.** Tombol salin punya pesan galat bila browser tidak mendukung.

## final-v2.9.0

Audit putaran kedua puluh lima dan kemudahan menghubungi pelanggan.

### Fitur baru

- **Hubungi pelanggan dari pre-order.** Nomor WhatsApp pada kartu pesanan kini menjadi tautan langsung.

### Perbaikan

- **Pool lebih tangguh.** Galat koneksi idle dicatat tanpa menghentikan proses, dan koneksi baru dibuat otomatis.
- **Pemulihan dikunci.** Kunci advisory mencegah transaksi lain menyela saat data diganti.
- **Salin lebih aman.** Tombol salin kode lacak memberi pesan bila browser tidak mendukung.
- **Hapus pengguna lengkap.** Riwayat opname ikut diperiksa sebelum akun dihapus.
- **Cadangan lebih ringkas.** JSON diekspor tanpa indentasi agar ukurannya lebih kecil.
- **Daftar preorder tanpa balapan.** Respons lama diabaikan agar hasil sesuai filter terbaru.
- **Dokumentasi.** Petunjuk bersih laju memuat argumen yang benar dan klaim status hapus diperbaiki.

## final-v2.8.0

Audit putaran kedua puluh empat dan kemudahan berbagi kode lacak.

### Fitur baru

- **Salin kode lacak.** Kartu pre-order memiliki tombol untuk menyalin kode lacak tanpa mengetik manual.

### Perbaikan

- **Laporan satu snapshot.** Seluruh kueri laporan berada dalam transaksi REPEATABLE READ, sehingga omzet dan rincian pengeluaran berasal dari titik waktu yang sama.
- **Server sibuk lebih jelas.** Timeout koneksi kini menghasilkan 503 dengan pesan singkat, bukan galat server umum.
- **Pool disesuaikan.** Jumlah koneksi per instance dinaikkan ke empat agar ekspor dan pemulihan tidak menguras koneksi kasir.
- **Pesan field ekstra diterjemahkan.** Galat Zod `unrecognized_keys` kini memakai Bahasa Indonesia.
- **Hapus master valid.** Menghapus menu atau bahan yang tidak ada kini menghasilkan galat "tidak ditemukan", bukan berhasil palsu.
- **Skrip lebih tangguh.** Koneksi ditutup walau kueri gagal, dan `.env.example` memuat penanda uji pembersihan laju.

## final-v2.7.0

Audit putaran kedua puluh tiga dan konsistensi cadangan.

### Perbaikan

- **Ekspor benar-benar snapshot.** Transaksi cadangan memakai isolasi REPEATABLE READ sehingga seluruh tabel berasal dari satu titik waktu.
- **Pesan validasi kembali jelas.** Pesan kustom Bahasa Indonesia seperti batas kata sandi dan format jam kini sampai ke pengguna.
- **Angka kasir konsisten.** Ringkasan diskon memakai nilai yang sudah dibatasi dan input menerima bilangan bulat.
- **Bersih laju lebih aman.** Skrip menolak bila penanda uji tidak diset di `.env.local`.
- **Kolam koneksi dikurangi.** Jumlah koneksi per instance disesuaikan untuk serverless.
- **Transaksi berat diperpanjang.** Endpoint kasir dan preorder memiliki batas durasi 60 detik.
- **Jam usaha divalidasi.** Format jam ketat dan jam tutup harus setelah jam buka.
- **Pemulihan mengikuti urutan tabel**, bukan urutan kunci berkas.
- **Nomor WhatsApp kosong jatuh ke pengaturan** bila variabel lingkungan tidak berisi nilai.

## final-v2.6.0

Audit putaran kedua puluh dua dan kerapian transaksi.

### Perbaikan

- **Kasir memakai data segar.** Daftar menu diambil dari endpoint terautentikasi tanpa cache, dan galat pemuatan kini ditampilkan.
- **Pilihan kasir konsisten.** Menu yang tersaring hilang dari pilihan akan dikosongkan, diskon dibatasi tidak negatif, dan catatan dibatasi 200 karakter.
- **Lacak dan riwayat tanpa balapan.** Permintaan lama dibatalkan atau diabaikan sehingga hasil selalu sesuai filter terbaru.
- **Bersih laju benar-benar aman.** Guard diperiksa sebelum membaca berkas, lingkungan produksi ditolak, dan argumen tidak disematkan dalam skrip npm.
- **Cadangan konsisten.** Seluruh tabel dibaca dalam satu transaksi sebagai snapshot.
- **Pesan validasi Bahasa Indonesia.** Galat Zod tidak lagi menampilkan teks Inggris.
- **Jam operasional memakai kontrol waktu** pada halaman Pengaturan.

## final-v2.5.0

Audit putaran kedua puluh satu dan pencarian menu kasir.

### Fitur baru

- **Cari menu di kasir.** Kolom pencarian menyaring menu yang tersedia sehingga lebih cepat dipilih saat daftar panjang.

### Perbaikan

- **Ekspor sesuai ukuran pool.** Kueri cadangan dijalankan dalam kelompok lima agar tidak mengantre melebihi batas koneksi.
- **Bersih laju lebih aman.** Perintah pembersihan menolak di lingkungan produksi dan memerlukan argumen eksplisit.
- **Laporan satu tahun lebih awet.** Endpoint laporan kini memiliki batas durasi fungsi 60 detik.
- **Pencarian riwayat lebih hemat.** Permintaan ditunda 250 ms setelah pengguna mengetik.
- **Lacak tanpa balapan.** Permintaan lama dibatalkan saat kode berubah atau komponen ditutup.

## final-v2.4.0

Audit putaran kedua puluh dan filter riwayat.

### Fitur baru

- **Filter riwayat lebih lengkap.** Transaksi bisa disaring berdasarkan metode pembayaran dan sumber, selain tanggal dan kata kunci.

### Perbaikan

- **Ubah pengguna tanpa kata sandi baru.** Kolom kata sandi kosong kini diterima sebagai "tidak diubah", dan dialog menyediakan pilihan status aktif.
- **Slot lebih tahan konkurensi.** Pemeriksaan kuota mengunci baris slot sebelum penulisan, dan batas laju GET dinaikkan agar IP bersama tidak kehabisan kuota.
- **Lacak memberi umpan balik.** Pencarian dari URL menampilkan pesan galat bila kode tidak ditemukan.
- **Dokumentasi keamanan mengikuti versi mayor 2.**
- **Alat uji.** Ditambah perintah `npm run bersih:laju` untuk mengosongkan pembatas laju saat menjalankan uji berulang.

## final-v2.3.0

Audit putaran kesembilan belas dan kelola pengguna.

### Fitur baru

- **Ubah pengguna.** Halaman Pengaturan kini bisa mengubah nama, email, peran, status, dan kata sandi pengguna yang sudah ada.

### Perbaikan

- **Catatan pemotongan audit benar.** Ekspor CSV kini benar-benar menandai bila hasil melebihi 5000 entri.
- **Preorder dan penghapusan menu aman.** Preorder mengunci menu yang dipakai, sehingga penghapusan menu tidak bisa menyela dan membuat pesanan mangkrak.
- **Ekspor preorder jujur.** CSV memberi catatan bila dipotong pada 500 baris dan nomor WhatsApp diamankan dari rumus spreadsheet.
- **Galat database lebih jelas.** Kode galat umum seperti kunci asing dan tipe salah kini menjadi respons 400.
- **Pelacakan mengikuti parameter.** Halaman lacak menyinkronkan input saat kode berubah, dan kode lacak otomatis terisi setelah pesanan berhasil.
- **Toast lebih konsisten.** Pesan galat memakai gaya dan peran yang tepat, dengan timer yang direset setiap kali.
- **Endpoint publik dibatasi.** Slot memiliki pembatas laju, konversi satuan khusus pemilik, dan batas login sukses dinaikkan agar alamat bersama tidak terkunci.

## final-v2.2.0

Audit putaran kedelapan belas dan ekspor pre-order.

### Fitur baru

- **Unduh CSV pre-order.** Daftar pesanan bisa diekspor sesuai filter status, nama, dan tanggal.

### Perbaikan

- **HPP benar-benar tidak keluar.** Endpoint preorder publik, kasir, dan daftar preorder tidak lagi mengirim nilai HPP. Nilai tersebut tetap dipakai internal untuk laporan.
- **Menu dengan preorder aman.** Penghapusan menu mengunci baris dan menolak bila masih ada preorder aktif.
- **Daftar preorder dibatasi.** Header tidak lagi memuat seluruh riwayat tanpa batas.
- **Validasi stok ketat.** Id bahan harus bilangan bulat positif dalam rentang integer.
- **Tampilan konsisten.** Resep disembunyikan untuk kasir dan toast galat memakai gaya serta peran yang berbeda dari toast sukses.
- **Ekspor audit jujur.** Berkas CSV memberi catatan bila hasil dipotong pada 5000 entri.
- **Dokumentasi keamanan diperjelas.** `SECURITY.md` kini membedakan prototipe dan produk jadi, termasuk kredensial demo dan kewajiban `RAHASIA_SESI`.

## final-v2.1.0

Audit putaran ketujuh belas dan penguatan pembatasan data.

### Fitur baru

- **Indikator kuota slot.** Pengaturan menampilkan progress bar pemakaian kuota setiap slot.

### Perbaikan

- **HPP benar-benar private.** Endpoint menu tidak lagi mengirim HPP dan harga rata rata resep kepada kasir, dan kolom HPP disembunyikan di tampilan.
- **Preorder lama tetap aman.** Menu yang masih dipakai preorder aktif tidak bisa dihapus.
- **Pesan checkout muncul.** Kekurangan waktu ambil kini memakai pemberitahuan yang terlihat.
- **Respons dibatasi.** Pembelian, opname, dan item preorder tidak lagi memuat seluruh riwayat tanpa batas.
- **Pesan duplikat tepat.** Konflik unik dibedakan berdasarkan constraint, bukan selalu "Email sudah dipakai".
- **Mutasi stok berpelaku.** Penyesuaian dan stok awal menyimpan id pengguna.
- **Validasi master.** Parameter id bahan yang bukan digit ditolak.
- **Tutup kasir dikunci.** Pemeriksaan pembaruan memakai kunci advisory agar aksi audit konsisten.
- **Dokumentasi.** Rekonsiliasi kas diperjelas hanya membandingkan uang tunai.

## final-v2.0.0

Pembaruan besar: analitik master data dan kerapian kebijakan data.

### Fitur baru

- **Ringkasan supplier.** Master data menampilkan jumlah pembelian dan total nilai per supplier.
- **Filter pergerakan stok.** Riwayat mutasi bisa disaring per bahan tanpa memuat ulang data lain.

### Perbaikan

- **Data keuangan benar-benar terbatas.** Kasir tidak lagi menerima harga rata rata maupun ringkasan nilai stok, baik lewat API maupun tampilan.
- **Pelaku perubahan tercatat.** Pembuatan pengguna kini mencatat pemilik yang melakukan, bukan "Sistem".
- **Email duplikat jelas.** Konflik email pengguna menghasilkan respons 400, bukan galat server umum.
- **Batas cadangan realistis.** Batas pemulihan disesuaikan dengan ukuran payload yang benar-benar bisa dikirim.
- **Laporan konsisten.** Kop cetak dan tautan CSV memakai rentang yang berhasil diterapkan, bukan nilai form yang belum diproses.
- **Checkout lebih awal.** Pelanggan diminta mengisi slot atau waktu ambil sebelum membuka formulir data diri.
- **Audit lebih rapi.** Header CSV audit diberi label Tabel, helper escape LIKE disatukan, dan pembaruan tutup kasir memakai kunci baris.

### Perubahan besar

Versi minor dinaikkan ke 2.0.0 karena kebijakan pembatasan data keuangan kini diterapkan sampai ke tingkat field respons, bukan hanya menyembunyikan komponen antarmuka.

## final-v1.16.0

Audit putaran kelima belas dan kerapian data master.

### Fitur baru

- **Filter pergerakan stok.** Riwayat pergerakan bisa disaring berdasarkan bahan.

### Perbaikan

- **Nilai stok hanya pemilik.** Kasir tidak lagi menerima total dan rincian nilai bahan lewat API.
- **Cadangan dapat dipulihkan.** Batas baris pemulihan dinaikkan agar cadangan dengan banyak entri audit tetap bisa dipakai.
- **Jejak akun tercatat.** Perubahan pengguna dan pengaturan sekarang masuk log audit tanpa menyimpan kata sandi, dan filter audit menyediakan kedua nilai tersebut.
- **Pencarian literal.** Karakter wildcard pada pencarian riwayat dan pre-order di-escape, seperti yang sudah berlaku pada audit.
- **Perubahan master akurat.** Pemeriksaan supplier dan kategori berada dalam transaksi dengan kunci baris, sehingga tidak ada audit untuk perubahan yang gagal.
- **Tutup kasir tepat.** Pembaruan dicatat sebagai "ubah", bukan "tambah".
- **Tautan CSV laporan memakai aturan server.** Tanggal mustahil tidak lagi membuat tautan aktif.

### Pengujian

Ditambah skrip uji untuk peran, wildcard, duplikat kategori, id desimal, dan ekspor audit.

## final-v1.15.0

Audit putaran keempat belas dan ringkasan nilai stok.

### Fitur baru

- **Nilai stok.** Halaman Bahan & Stok menampilkan total nilai bahan aktif, jumlah bahan, bahan menipis, dan lima bahan bernilai terbesar.

### Perbaikan

- **Ekspor audit lengkap.** Unduhan CSV tidak lagi dibatasi 200 baris dan karakter wildcard pada kata kunci di-escape.
- **Nama kategori duplikat jelas.** Konflik nama kini menghasilkan respons 400, bukan galat server umum.
- **Master data konsisten.** Pemeriksaan keberadaan supplier dan kategori dilakukan di dalam transaksi yang sama dengan perubahan data.
- **Id master ketat.** Parameter id desimal ditolak, sehingga log audit tidak mencatat penghapusan yang tidak terjadi.
- **Unduh CSV laporan aman.** Tautan dinonaktifkan bila rentang tidak valid menurut aturan server.
- **Batas satu tahun tepat.** Rentang laporan dibatasi 365 hari kalender.
- **Dokumentasi.** README kini menyebut ekspor CSV jejak aktivitas.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.14.0

Audit putaran ketiga belas dan ekspor jejak aktivitas.

### Fitur baru

- **Unduh CSV jejak aktivitas.** Log audit bisa diekspor sesuai filter aksi, data, dan kata kunci yang sedang dipakai.

### Perbaikan

- **Rentang laporan dibatasi.** Tanggal masa depan dan rentang lebih dari satu tahun ditolak di server, bukan hanya di tampilan.
- **Proporsi pengeluaran terbaca.** Batang kategori laporan memberi nilai dan label untuk pembaca layar.
- **Agregasi kategori teruji.** Pengelompokan pengeluaran kini berupa fungsi murni dengan pengujian regresi.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.13.0

Audit putaran kedua belas dan rincian pembelian.

### Fitur baru

- **Rincian pembelian dan opname.** Tombol Rincian pada tabel stok menampilkan item, harga, dan selisih yang sebelumnya hanya bisa diakses lewat API.
- **Pengeluaran per kategori.** Laporan menampilkan jumlah dan proporsi pengeluaran untuk setiap kategori.

### Perbaikan

- **Audit mengikuti transaksi.** Pencatatan aktivitas pada bahan, menu, supplier, dan kategori kini berada dalam transaksi yang sama dengan perubahan data, sehingga galat log tidak membuat klien mengira data gagal disimpan.
- **Daftar pre-order cocok dengan angka dashboard.** Filter tanggal tidak lagi diterapkan secara bawaan.
- **Supplier nonaktif tidak dipakai.** Dropdown pembelian hanya menampilkan supplier aktif dan server menolak supplier nonaktif.
- **Filter audit lengkap.** Opsi data kini mencakup semua nilai tabel yang benar-benar ditulis.
- **Logout memeriksa asal permintaan** dan input tanggal laporan memakai batas hari ini.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.12.0

Audit putaran kesebelas dan kerapian validasi.

### Fitur baru

- **Tombol mata di kelola pengguna.** Kata sandi saat menambah pengguna bisa ditampilkan atau disembunyikan, sama seperti di halaman login.

### Perbaikan

- **Tanggal preorder divalidasi ketat.** Tanggal kalender yang tidak ada kini ditolak, bukan tersimpan apa adanya.
- **Riwayat tidak gagal saat tanggal dikosongkan.** Filter mengirim nilai bawaan, sementara parameter kosong dari API tetap ditolak dengan jelas.
- **Hash rusak tidak membuka akun.** Kata sandi ditolak lebih awal bila format hash tidak valid.
- **Input tanggal mengikuti aturan server.** Pembelian, opname, dan slot memakai batas tanggal pada kolom input.
- **Urutan kunci stok konsisten.** Pembelian dan opname mengurutkan bahan sebelum mengunci baris untuk mengurangi bentrok transaksi paralel.
- **Kolam koneksi disesuaikan.** Jumlah koneksi per instance dinaikkan agar transaksi paralel tidak menguras pool.
- **Dokumentasi keamanan diperbarui.** `SECURITY.md` kini mencantumkan cabang `final` dan kredensial demo, serta README menjelaskan cara mengganti kata sandi yang sebenarnya.

### Pengujian

Ditambah pengujian untuk parameter tanggal kosong dan tanggal kalender tidak valid.

## final-v1.11.0

Audit putaran kesepuluh dan kemudahan mengisi kata sandi.

### Fitur baru

- **Tombol mata pada login.** Kata sandi bisa ditampilkan atau disembunyikan dengan satu klik. Nilai input tetap terjaga dan tombol punya nama untuk pembaca layar.
- **Akun demo tidak ditampilkan di produksi.** Petunjuk akun demo hanya muncul pada lingkungan pengembangan.

### Perbaikan

- **Alokasi diskon presisi.** Pembagian pada omzet menu terlaris memakai bilangan desimal, sehingga nilainya sama dengan laporan walau ada diskon.
- **Alokasi omzet tidak null.** Pembagian memakai bilangan desimal dan hasil nol tidak menghilangkan baris menu terlaris.
- **Tombol WhatsApp hanya muncul bila nomor tersedia.** Kartu bahan menipis tidak lagi membuka WhatsApp ke nomor kosong.
- **Validasi tanggal seragam.** Pembelian dan opname juga menolak tanggal masa depan, sedangkan riwayat menolak parameter tanggal kosong.
- **Login membatasi ukuran permintaan.** Body permintaan login dibatasi 4 KB sebelum diproses.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.10.0

Audit putaran kesembilan dan perbandingan penjualan.

### Perbaikan

- **Omzet menu terlaris konsisten.** Omzet per menu kini memperhitungkan diskon secara proporsional, sehingga sama dengan omzet harian dan laporan.
- **Batas berkas disamakan.** UI dan server sama-sama membatasi berkas cadangan 4 MB sesuai batas platform.
- **Data dashboard lebih segar.** Cache status publik diperbarui tiap lima detik agar perubahan harga dan status toko lebih cepat terlihat.
- **Riwayat menolak tanggal salah.** Format tanggal tidak valid kini menghasilkan respons 400, bukan filter diam-diam.
- **Tanggal masa depan ditolak.** Pengeluaran dan tutup kasir tidak bisa dicatat melebihi hari ini.

### Fitur baru

- **Perbandingan kemarin.** Dashboard menampilkan omzet dan jumlah transaksi hari sebelumnya sebagai pembanding.

### Penggunaan

Tidak ada perubahan cara pakai. Untuk cadangan besar, tetap perhatikan batas ukuran dan durasi function pada paket Vercel yang dipakai.

## final-v1.9.0

Audit putaran kedelapan dan penyelesaian pre-order.

### Perbaikan

- **Pemulihan lebih cepat dan aman.** Penyisipan dikelompokkan per 200 baris, batas ukuran disesuaikan dengan batas platform, dan waktu eksekusi diperpanjang.
- **Preorder tidak setengah tersimpan.** Nomor WhatsApp admin kini diperiksa sebelum pesanan dibuat.
- **Metode bayar bisa dipilih.** Dialog penyelesaian pre-order menyediakan tunai, QRIS, dan transfer, serta tercatat di laporan dan tutup kasir.
- **Cadangan lebih ringan.** Ekspor memiliki batas waktu eksekusi yang jelas dan atribusi operator dipertahankan bila akunnya masih ada.
- **CSV riwayat jujur.** Berkas memberi catatan bila hasil dipotong pada 5.000 baris.
- **Sumber nomor konsisten.** Prioritas nomor WhatsApp disamakan dan nilai tetap dihapus.
- **Slot hari ini lebih akurat.** Slot dengan jam yang sudah lewat tidak lagi ditampilkan.
- **Kolam koneksi sesuai serverless.** Jumlah koneksi per instance dikurangi agar tidak melebihi kuota database.
- **Pengaman CSV diperluas.** Tab dan carriage return ikut ditangani.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.8.0

Audit putaran ketujuh dan kerapian operasional.

### Perbaikan

- **Slot tidak bisa dipesan tetapi tampil.** Format jam kini wajib HH:mm dan tanggal slot tidak boleh lampau, sehingga slot tidak lagi tampil tetapi ditolak saat dipesan.
- **Kuota slot konsisten.** Jumlah terisi dihitung ulang dari preorder aktif setiap kali kuota diubah, sehingga tampilan dan server tidak bertolak belakang.
- **Waktu ambil diperiksa ulang.** Pemeriksaan WIB dilakukan lagi di dalam transaksi sebelum preorder disimpan.
- **Pembatasan laju dibersihkan.** Baris kedaluwarsa dihapus secara berkala agar tabel tidak tumbuh terus.
- **Nomor WhatsApp tidak jatuh ke nilai tetap.** Di produksi, preorder gagal keras bila nomor admin belum dikonfigurasi.
- **CSV aman dibuka di spreadsheet.** Nama menu yang diawali simbol rumus diberi tanda pengaman.
- **Metode bayar preorder mengikuti pilihan.** Penyelesaian preorder tidak lagi memaksa tunai.
- **Ekspor CSV riwayat dibatasi.** Maksimal 5.000 baris per unduhan agar tidak membebani serverless.
- **Checkout lebih bersih.** Slot kadaluarsa tidak lagi ditampilkan pada daftar pilihan.

### Penggunaan

Tidak ada perubahan cara pakai. Pastikan `WHATSAPP_ADMIN` terisi di produksi sebelum menerima preorder.

## final-v1.7.0

Audit putaran keenam dan pembatasan data keuangan.

### Perbaikan

- **Keuangan khusus pemilik.** Kasir tidak lagi bisa melihat omzet, laba, nilai stok, pengeluaran, atau rincian pembelian lewat API. Halaman Laporan dan Keuangan juga diblokir untuk kasir baik lewat menu maupun URL langsung.
- **Dashboard sesuai peran.** Kasir melihat pre-order, stok, dan aksi cepat tanpa angka keuangan.
- **Waktu ambil memakai WIB.** Perbandingan jam tidak lagi mengikuti UTC server, sehingga preorder tidak ditolak karena selisih tujuh jam.
- **Slot harus cocok.** Tanggal dan jam pada waktu ambil harus sama dengan slot yang dipilih.
- **Omzet per menu setelah diskon.** Diskon dialokasikan proporsional sehingga total omzet per menu sama dengan omzet ringkasan.
- **Sequence cadangan rapi.** Tabel kosong pasca-pemulihan mulai dari id 1.
- **Aksesibilitas.** Batang grafik laporan tidak lagi menjadi titik fokus keyboard tanpa fungsi.

### Fitur baru

- **Ekspor CSV riwayat.** Unduh transaksi pada rentang tanggal dan kata kunci yang sedang dipakai.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.6.0

Audit putaran kelima dan analitik operasional.

### Perbaikan kritis

- **Tanggal kolom DATE dibaca sebagai teks.** Parser database kini mengembalikan `YYYY-MM-DD`, sehingga preorder lewat slot tidak lagi ditolak dan grafik serta jadwal menampilkan tanggal yang benar.
- **Pemulihan cadangan produksi.** Batas ukuran permintaan untuk endpoint pemulihan dinaikkan menjadi 8 MB dan berkas divalidasi lengkap sebelum tabel dikosongkan.
- **Akun pada cadangan tidak merusak relasi.** Kolom referensi pengguna dinolkan saat memulihkan ke database lain.
- **Preorder lama tetap selesai.** Menu yang sudah dinonaktifkan tetap boleh diproses lewat jalur preorder.
- **Waktu ambil lebih ketat.** Jam dan menit divalidasi, termasuk waktu yang sudah lewat pada hari yang sama.
- **Pemilik terakhir terkunci.** Pemeriksaan jumlah pemilik aktif memakai kunci advisory agar dua perubahan bersamaan tidak menghilangkan semua pemilik.
- **Identitas cetak langsung.** Struk kasir dan kop laporan mengambil nama usaha dari endpoint yang tidak di-cache.

### Fitur baru

- **Laba per menu.** Laporan menampilkan porsi, omzet, dan laba untuk setiap menu.
- **Nilai stok.** Dashboard menampilkan total nilai bahan aktif.
- **Kirim daftar stok.** Tombol pada dashboard menyusun pesan WhatsApp berisi bahan yang perlu diisi.

### Peningkatan

- Urutan tanggal pada ekspor CSV diberi penanda WIB, kunci daftar menu diperbaiki, dan ukuran berkas cadangan diperiksa sebelum dibaca.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.5.0

Audit putaran keempat dan pemulihan cadangan.

### Perbaikan

- **Preorder lama tetap selesai.** Id varian dipertahankan saat menu diedit, bahan nonaktif tetap ikut dihitung, dan varian yang sudah hilang memakai resep dasar.
- **Pengguna bisa dihapus.** Akun yang punya riwayat kini dinonaktifkan, bukan dihapus paksa, sehingga tidak lagi menimbulkan galat kunci asing.
- **Pemilik terlindungi.** Pemilik tidak bisa menurunkan peran atau menonaktifkan akunnya sendiri, dan pemilik aktif terakhir tidak bisa diturunkan.
- **Risiko deadlock dikurangi.** Kunci barang bahan diambil dengan urutan konsisten dan bentrok transaksi diberi pesan yang jelas.
- **Stok edit terkunci.** Pembacaan stok sebelum penyesuaian memakai kunci baris agar tidak tertimpa transaksi bersamaan.
- **Struk dan laporan mengikuti pengaturan.** Nama usaha di kedua cetakan diambil dari pengaturan.
- **Waktu ambil divalidasi.** Format dan tanggal waktu ambil diperiksa di server.
- **Angka gagal muat tidak ditampilkan.** Ringkasan memakai tanda pengganti dan tombol cetak laporan dinonaktifkan bila data belum tersedia.
- **Aksesibilitas.** Tombol hapus dan penambah jumlah menyebut nama menu untuk pembaca layar.

### Fitur baru

- **Pulihkan cadangan.** Pemilik bisa mengembalikan seluruh data dari berkas JSON dengan konfirmasi eksplisit. Akun pengguna sengaja tidak diubah.

### Dokumentasi

- Panduan demo ditandai khusus prototipe, daftar variabel lingkungan diselaraskan, dan klaim Row Level Security dirinci agar tidak menyesatkan.

### Penggunaan

Tidak ada perubahan cara pakai. Simpan berkas cadangan dari halaman Pengaturan sebelum memakai fitur pemulihan.

## final-v1.4.0

Audit putaran ketiga dan penyempurnaan alur kerja.

### Perbaikan kritis

- **HPP multi item benar.** HPP semua item dalam satu transaksi kini dijumlahkan, bukan hanya item pertama.
- **Halaman pemilik diamankan.** Kasir tidak bisa membuka halaman Master data dan Pengaturan lewat URL langsung.
- **Harga rata rata tepat.** Pembelian dengan stok lama nol memakai harga baru, sehingga HPP tidak melonjak.
- **Tanggal slot ketat.** Tanggal mustahil seperti 31 Februari ditolak, konsisten dengan endpoint lain.
- **Nama usaha konsisten.** Halaman lacak dan struk mengikuti pengaturan, bukan teks tetap.
- **Ringkasan tidak menyesatkan.** Galat pemuatan statistik kini ditampilkan, bukan ditampilkan sebagai angka nol.
- **Data publik dibatasi.** Render awal website memakai daftar putih pengaturan yang sama dengan API.
- **TLS dapat dikonfigurasi.** Verifikasi sertifikat database aktif secara bawaan dan bisa dimatikan untuk proksi lokal.
- **Aksesibilitas.** Label baris dinamis, urutan judul, dan batang grafik tidak lagi menyesatkan pembaca layar.

### Fitur baru

- **Struk kasir.** Setiap transaksi bisa langsung dicetak dari dialog keberhasilan.
- **Ringkasan laporan cetak.** Laporan keuangan punya ringkasan berformat cetak.
- **Filter pre-order.** Cari berdasarkan kode atau pelanggan dan saring berdasarkan status serta tanggal.
- **Filter jejak aktivitas.** Saring log berdasarkan aksi, data, dan kata kunci.
- **Pembatasan laju dua lapis.** Percobaan login dibatasi sebelum komputasi kata sandi dan percobaan gagal tetap dihitung per email.

### Penggunaan

Tidak ada perubahan cara pakai. Set `.env.local` dengan `DATABASE_TLS_VERIFY=false` hanya bila proksi lokal memakai sertifikat mandiri.

## final-v1.3.0

Audit putaran kedua dan pengembangan lanjutan.

### Perbaikan kritis

- **HPP laporan tepat.** HPP per porsi kini dikalikan jumlah porsi, sehingga laba kotor dan laba bersih tidak lagi terlalu tinggi.
- **Sequence data benar.** Seluruh sequence identity diselaraskan dengan data yang ada, jadi supplier, kategori, dan data lain bisa ditambahkan setelah data contoh dimuat.
- **Muat ulang data diperbaiki.** Urutan penghapusan mengikuti kunci asing sehingga data contoh bisa dikembalikan kapan saja.
- **Tanggal kalender ketat.** Tanggal seperti 31 Februari ditolak dengan respons 400, bukan 500.
- **Email pengguna seragam.** Email disimpan dalam huruf kecil sehingga pemilik dan kasir bisa masuk dengan kombinasi huruf apa pun.
- **Bahan bersejarah aman.** Bahan yang sudah dipakai transaksi dinonaktifkan, bukan dihapus, agar riwayat tetap utuh.
- **Slot tidak bisa dihidupkan ulang.** Preorder batal tidak bisa dikembalikan ke diproses karena kuota sudah dilepas.
- **Pelacakan lebih sempit.** Hanya kode lacak yang diterima dan catatan internal tidak dikirim ke publik.
- **Cadangan lengkap.** Seluruh tabel induk dan turunan ikut diekspor, versi diambil dari paket, dan batas 500 baris dihapus.
- **Pengaturan terlindungi.** Endpoint pengaturan hanya bisa diakses setelah masuk.

### Fitur baru

- **Master data.** Halaman baru untuk menambah, mengubah, dan menonaktifkan supplier serta mengelola kategori pengeluaran.
- **Konversi satuan.** Kalkulator kg ke gram, liter ke ml, dan lusin ke pcs memakai data dari database.
- **Menu paling laku.** Dashboard menampilkan lima menu terlaris tujuh hari terakhir beserta omzetnya.
- **Struk mengikuti pengaturan.** Nama usaha pada cetakan rincian transaksi diambil dari pengaturan, bukan teks tetap.

### Peningkatan

- **Pembatasan laju adil.** Percobaan gagal dihitung per alamat dan email. Lapisan kasar menambah batas total permintaan login sebelum komputasi kata sandi.
- **Aksesibilitas.** Grafik memberi label pembaca layar, tombol jumlah keranjang punya nama dan ukuran sentuh yang cukup.
- **Pemberitahuan bersih.** Pesan galat pada riwayat hilang setelah permintaan berikutnya berhasil.

### Penggunaan

Jalankan `npm run db:migrasi` sekali pada database final. Untuk mengembalikan data demo ke keadaan awal, jalankan `npm run muat:contoh`.

## final-v1.2.1

Kestabilan penyegaran data publik.

### Perbaikan

- **Cache lebih tahan gangguan.** Endpoint publik mencoba ulang sekali bila koneksi database sempat terputus saat cache diperbarui.
- **Kueri lebih sedikit.** Data publik tidak lagi mengambil data bahan yang tidak dipakai.
- **Penyegaran lebih jarang.** Cache status toko diperbarui setiap 30 detik untuk mengurangi beban database.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.2.0

Audit mendalam dan pembaruan besar pada produk final.

### Keamanan dan konsistensi

- **Statistik dibatasi.** Data omzet, transaksi, dan pengeluaran kini hanya bisa diambil oleh pengguna yang masuk. Website konsumen tetap memakai endpoint publik tanpa data keuangan.
- **Sesi diperiksa ulang.** Perubahan peran atau status pengguna langsung berlaku tanpa menunggu token kedaluwarsa.
- **Resep varian terjaga.** Mengubah menu tidak lagi menghapus resep pada varian.
- **Pembatasan laju atomik.** Batas percobaan login, pre-order, dan pelacakan tidak bisa dilewati dengan permintaan paralel.
- **Nomor unik.** Penomoran penjualan dan pembelian memakai kunci advisory agar tidak bentrok saat transaksi bersamaan.
- **Slot konsisten.** Membatalkan pre-order mengembalikan kuota slot yang dipakai.
- **HPP historis.** Nilai HPP disimpan pada setiap item transaksi, sehingga laporan lama tidak berubah saat resep atau harga bahan diubah.
- **Otorisasi seragam.** Restock dan tutup kasir hanya untuk pemilik, dan tombol yang tidak diizinkan disembunyikan dari kasir.
- **Validasi lebih ketat.** Format tanggal, diskon, dan status toko tutup diperiksa di server.
- **Jejak audit lengkap.** Restock, pengeluaran, dan tutup kasir ikut tercatat.

### Fitur baru

- **Grafik omzet tujuh hari.** Dashboard menampilkan grafik batang native tanpa pustaka tambahan.
- **Daftar bahan menipis.** Dashboard menampilkan bahan yang perlu diisi beserta batas minimum.
- **Riwayat transaksi.** Halaman baru untuk mencari penjualan berdasarkan nomor atau menu, melihat rincian, dan mencetak struk.
- **Cadangan data.** Pemilik bisa mengunduh seluruh data usaha dalam berkas JSON tanpa kata sandi pengguna.
- **Tanya jawab konsumen.** Website menampilkan pertanyaan umum tentang pemesanan, jam ambil, dan pelacakan.

### Peningkatan

- **Identitas merek.** Warna mengikuti lembar identitas dan font memakai Poppins serta Inter dari sistem tanpa unduhan luar jaringan.
- **Lebih ringan.** Seluruh menu, varian, dan resep dimuat sekali per transaksi, bukan sekali per item.
- **Migrasi aman.** Perintah `npm run db:migrasi` menambahkan kolom baru tanpa menghapus data lama.

### Penggunaan

Jalankan `npm run db:migrasi` sekali pada database final sebelum memakai versi ini. Tidak ada perubahan lain pada cara pakai.

## final-v1.1.1

Ikon kategori pada kartu menu.

### Peningkatan

- **Ikon per kategori.** Setiap kartu menu kini punya ikon sesuai kategorinya: mangkuk, api, wonton, tambahan, dan gelas.
- **Aksen responsif.** Garis pendek pada kartu memanjang saat kartu disorong, memberi umpan balik halus tanpa menggeser tata letak.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.1.0

Navigasi dan keadaan kosong pada website konsumen.

### Peningkatan

- **Header menempel.** Identitas usaha tetap terlihat saat halaman digulir, dengan bilah filter yang berhenti tepat di bawahnya.
- **Jarak gulir tepat.** Tombol Mulai pesan membawa pembaca ke judul menu tanpa tertutup header.
- **Keadaan kosong berguna.** Bila pencarian tidak menemukan menu, muncul tanda Jebew dan tombol untuk menampilkan semua menu kembali.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.9

Umpan balik pesanan dan panel status hari ini.

### Peningkatan

- **Pemberitahuan singkat.** Saat menu masuk keranjang, muncul pemberitahuan kecil yang hilang otomatis dan terbaca pembaca layar.
- **Panel status warna merek.** Kartu jumlah menu siap dipesan di area sambutan memakai warna utama dengan tanda Jebew sebagai latar.
- **Kontras terjaga.** Label status pada panel tersebut memenuhi ambang kontras tanpa mengurangi identitas visual.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.8

Penyempurnaan struktur dan warna website konsumen.

### Peningkatan

- **Panduan tiga langkah.** Bagian Cara pesan menjelaskan pilih menu, isi data, lalu terima konfirmasi WhatsApp.
- **Batas kartu berwarna.** Tiap kartu menu memakai garis atas sesuai warna kategori.
- **Warna teks lebih gelap.** Teks sekunder dan angka langkah memenuhi ambang kontras tanpa mengurangi keterbacaan.

### Penggunaan

Tidak ada perubahan cara pakai.

## final-v1.0.7

Penyempurnaan kartu menu dan daftar kategori.

### Peningkatan

- **Kartu lebih jelas.** Harga sejajar dengan nama menu, varian ditampilkan sebagai chip, dan tombol Tambah ke pesanan memakai lebar penuh.
- **Filter berjumlah.** Setiap kategori menampilkan jumlah menu agar konsumen tahu isi kategori sebelum memilih.
- **Garis identitas.** Keterangan kategori diberi garis pendek sebagai penanda visual pada area sambutan.
- **Kontras dan label.** Dua temuan aksesibilitas pada warna jumlah kategori dan nama tombol diperbaiki.

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
