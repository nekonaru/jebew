<div align="center">
  <img src="public/assets/jebew-mark.png" alt="Tanda Jebew" width="120" />
  <h1>Jebew: Manajemen Stok dan Kasir UMKM</h1>
  <p><b>Kelola stok, pencatatan penjualan, dan pre-order UMKM mie dalam satu aplikasi,<br/>
  dengan status menu yang berubah otomatis mengikuti sisa bahan.</b></p>

  <a href="https://github.com/nekonaru/jebew/releases"><img src="https://img.shields.io/github/v/release/nekonaru/jebew?style=flat-square&color=blue" alt="Rilis" /></a>
  <a href="https://github.com/nekonaru/jebew/actions/workflows/ci.yml"><img src="https://github.com/nekonaru/jebew/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Platform-Web-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/Lisensi-MIT-green?style=flat-square" alt="Lisensi" />
  <img src="https://img.shields.io/badge/Status-Prototipe-orange?style=flat-square" alt="Status" />
</div>

<br />

> [!NOTE]
> Seluruh dokumentasi, kode, dan antarmuka proyek ini memakai Bahasa Indonesia. Ini adalah prototipe Tahap 1 untuk tugas PBL, bukan produk jadi.

---

## Daftar Isi

- [Tentang](#tentang)
- [Fitur](#fitur)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Konfigurasi](#konfigurasi)
- [Skenario Demo](#skenario-demo)
- [Struktur Proyek](#struktur-proyek)
- [Pengembangan](#pengembangan)
- [Pengujian](#pengujian)
- [Keamanan](#keamanan)
- [Integrasi Berkelanjutan](#integrasi-berkelanjutan)
- [FAQ](#faq)
- [Penulis](#penulis)
- [Disclaimer](#disclaimer)
- [Lisensi](#lisensi)

---

## Tentang

**Jebew** adalah prototipe aplikasi pre-order untuk **Warung Kak Ikaa**, penjual Mie Jebew Chili Oil dan Wonton Ayam Chili Oil. Aplikasi ini menyatukan dua sisi dalam satu database: dashboard admin untuk mengelola bahan, resep, kasir, laporan, dan pre-order, serta website konsumen untuk melihat menu yang masih tersedia dan memesan lewat WhatsApp.

Menu yang tersedia mencakup 11 varian Mie Jebew, 4 pilihan wonton, 2 mie chili oil, 10 extra topping, dan 6 minuman. Level pedas 0 sampai 3 dicantumkan pelanggan lewat kolom catatan saat memesan.

Inti sistem ada pada resep. Setiap menu menyimpan daftar bahan dan jumlah per satu porsi. Jumlah porsi yang bisa dibuat dihitung dari nilai terkecil antara stok bahan dibagi kebutuhan per porsi. Saat transaksi dicatat, stok berkurang otomatis dan status menu di website berubah tanpa diubah manual.

> _"Sisa bahan jelas, menu yang bisa dijual juga jelas."_

---

## Fitur

### Dashboard Admin

| Fitur | Deskripsi |
|-------|-----------|
| **Kelola bahan baku** | Tambah, ubah, dan hapus bahan beserta satuan, stok, dan batas minimum |
| **Tambah stok** | Isi stok bahan dengan satu angka penambahan, tanpa mengubah data lain |
| **Peringatan stok menipis** | Tandai bahan yang stoknya sama dengan atau di bawah batas minimum |
| **Menu dan resep** | Tambah, ubah, dan hapus menu beserta daftar bahan per satu porsi |
| **Perhitungan porsi** | Tampilkan jumlah porsi yang bisa dibuat dan sebutkan bahan penghambatnya |
| **Kasir** | Pilih menu dan jumlah, lalu simpan transaksi dengan metode pembayaran |
| **Penolakan stok kurang** | Tolak transaksi dan sebutkan bahan mana yang kurang beserta jumlahnya |
| **Laporan harian** | Lihat omzet, jumlah transaksi, menu terlaris, dan daftar transaksi dengan filter tanggal |
| **Pre-order** | Lihat pesanan masuk, ubah statusnya, dan tandai selesai untuk mencatat penjualan |

### Website Konsumen

| Fitur | Deskripsi |
|-------|-----------|
| **Status menu** | Badge Tersedia atau Habis dihitung dari sisa stok dan resep |
| **Sisa porsi** | Tampilkan sisa porsi bila jumlahnya lima atau kurang |
| **Pembaruan otomatis** | Status menu disegarkan setiap 15 detik dari cache 10 detik, tanpa memuat ulang halaman |
| **Pre-order** | Pilih beberapa menu, isi nama, WhatsApp, waktu ambil, dan catatan |
| **Pesan WhatsApp siap kirim** | Tautan wa.me dibuka dengan rincian pesanan dan total yang sudah terformat |
| **Pesanan ditolak bila habis** | Menu yang habis tidak bisa dipilih dan permintaan ditolak di server |

### Aturan Data

| Fitur | Deskripsi |
|-------|-----------|
| **Transaksi atomik** | Pengecekan stok, penyimpanan penjualan, dan pengurangan stok terjadi dalam satu transaksi database |
| **Snapshot harga** | Nama menu dan harga disimpan saat transaksi agar laporan lama tidak berubah |
| **Stok tidak negatif** | Batas database menolak nilai stok di bawah nol |
| **Data contoh** | 33 menu dan 23 bahan Warung Kak Ikaa siap pakai untuk keperluan demo |
| **Filter dan pencarian** | Pilih kategori atau cari nama menu tanpa memuat ulang halaman |
| **Total langsung** | Total pre-order terhitung otomatis saat menambah menu dan mengubah jumlah |

---

## Persyaratan

| Dependensi | Versi Minimum | Catatan |
|------------|---------------|---------|
| **Node.js** | 24 | Versi yang dipakai untuk pengembangan dan CI |
| **npm** | 11 | Disertakan bersama Node.js 24 |
| **Browser** | Versi terkini | Chrome, Edge, Firefox, atau Safari |
| **Git** | 2.40 | Dibutuhkan hanya untuk mengambil kode sumber |

> [!TIP]
> Aplikasi ini memakai Supabase Postgres. Kamu perlu satu project Supabase gratis untuk menyimpan data, dan akun Vercel bila ingin mempublikasikannya.

### Belum pernah memakai terminal? Mulai dari sini

<details>
<summary><b>Cara membuka terminal di Windows</b></summary>

1. Tekan tombol **Windows**, ketik `PowerShell`, lalu tekan **Enter**
2. Jendela biru akan terbuka. Di situlah kamu mengetik setiap perintah di panduan ini
3. Arahkan terminal ke folder proyek dengan perintah `cd lokasi-folder-jebew`

</details>

---

## Instalasi

### Opsi A: Jalankan dari kode sumber

#### 1. Ambil kode proyek

<details>
<summary><b>Kalau Git sudah terpasang</b></summary>

```bash
git clone https://github.com/nekonaru/jebew.git
cd jebew
```

</details>

<details>
<summary><b>Kalau Git belum terpasang</b></summary>

1. Buka halaman repositori di GitHub
2. Klik tombol hijau **Code**, lalu pilih **Download ZIP**
3. Ekstrak berkas ZIP ke folder pilihanmu
4. Di terminal, masuk ke folder tersebut, misalnya `cd Downloads/jebew-main`

</details>

#### 2. Pasang dependensi

```bash
npm ci
```

> [!IMPORTANT]
> Perintah ini harus selesai tanpa galat. Bila ada galat, periksa versi Node.js dengan `node --version`.

#### 3. Buat project Supabase

1. Buka `https://supabase.com` dan masuk dengan akunmu
2. Buat project baru, lalu tunggu sampai statusnya aktif
3. Buka **Project Settings**, lalu **Database**, dan salin **Connection string** untuk koneksi langsung atau transaction pooler
4. Salin berkas contoh lingkungan:

```bash
cp .env.example .env.local
```

5. Isi `DATABASE_URL` dengan connection string tadi. Ganti `[KATA_SANDI]` dengan kata sandi database project-mu
6. Isi `ADMIN_PIN`, `RAHASIA_SESI`, dan `WHATSAPP_ADMIN`

> [!IMPORTANT]
> Jangan pernah memasukkan nilai `DATABASE_URL` yang sebenarnya ke dalam chat, commit, atau berkas yang masuk git. Berkas `.env.local` sudah ada di `.gitignore`.

#### 4. Siapkan tabel dan data contoh

```bash
npm run siap:supabase
```

Perintah ini menjalankan `database/schema.sql` dan `database/seed.sql` ke project Supabase-mu. Perintah bisa dijalankan ulang dengan aman.

> [!IMPORTANT]
> Di lingkungan produksi, aplikasi akan menolak jalan bila `ADMIN_PIN` atau `RAHASIA_SESI` kosong. Isi keduanya sebelum deploy.

#### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

### Opsi B: Deploy ke Vercel

1. Buka `https://vercel.com`, masuk dengan akun GitHub-mu, lalu pilih **Add New**, **Project**
2. Impor repositori `nekonaru/jebew`. Vercel akan mendeteksi Next.js otomatis
3. Pada bagian **Environment Variables**, isi `DATABASE_URL`, `ADMIN_PIN`, dan `RAHASIA_SESI`. Isi juga `WHATSAPP_ADMIN` dan `NAMA_USAHA` bila perlu
4. Tekan **Deploy**. Setelah selesai, buka URL produksi yang diberikan
5. Jalankan `npm run siap:supabase` secara lokal sekali untuk memasang tabel dan data contoh ke project Supabase yang sama

> [!IMPORTANT]
> `DATABASE_URL` produksi sebaiknya memakai connection string transaction pooler dari Supabase. Jangan memakai PIN bawaan `1234` di Vercel.

---

## Penggunaan

### Pertama kali dibuka

1. Pastikan `npm run siap:supabase` sudah dijalankan dan 33 menu contoh tampil di website
2. Buka `http://localhost:3000` untuk melihat website konsumen
3. Perhatikan status Tersedia pada Mie Jebew Original dengan sisa delapan porsi
4. Buka `http://localhost:3000/admin/login` dan masukkan PIN admin

> [!NOTE]
> Data tersimpan di Supabase, bukan di komputer. Untuk mengembalikan data contoh, hapus baris di tabel `penjualan`, `item_penjualan`, `preorder`, dan `item_preorder`, lalu jalankan ulang `database/seed.sql` lewat SQL Editor Supabase.

### Pemakaian sehari-hari

- Tambah atau ubah bahan di menu **Bahan baku**, lalu isi stoknya lewat tombol **Tambah stok**
- Buat menu beserta resepnya di menu **Menu & resep**, lalu perhatikan angka porsi yang muncul
- Catat penjualan di menu **Kasir**. Stok berkurang otomatis setelah transaksi berhasil
- Lihat omzet dan transaksi di menu **Laporan** dengan filter tanggal
- Olah pesanan di menu **Pre-order**. Stok baru dipotong saat pesanan ditandai selesai
- Buat pre-order dari website konsumen, lalu kirim pesan yang sudah siap ke WhatsApp admin

---

## Konfigurasi

Variabel lingkungan dibaca dari berkas `.env.local`.

| Variabel | Wajib | Fungsi |
|----------|-------|--------|
| `DATABASE_URL` | Ya | Connection string Postgres dari Supabase |
| `ADMIN_PIN` | Ya di produksi | PIN masuk dashboard. Boleh kosong hanya saat pengembangan lokal |
| `RAHASIA_SESI` | Ya di produksi | Kunci penandatanganan cookie sesi. Pakai string acak panjang |
| `WHATSAPP_ADMIN` | Tidak | Nomor tujuan pesan pre-order dalam format internasional tanpa tanda plus |
| `NAMA_USAHA` | Tidak | Nama yang tampil di pesan WhatsApp bila pengaturan database kosong |

> [!NOTE]
> Nomor WhatsApp admin juga bisa diubah lewat baris `whatsapp_admin` pada berkas `database/seed.sql` sebelum data contoh pertama kali dimasukkan.

---

## Skenario Demo

Simulasi lima menit untuk presentasi ke dosen dan mitra. Panduan lengkap ada di [`docs/panduan-demo.md`](docs/panduan-demo.md).

1. Tampilkan website konsumen. Mie Jebew Original berstatus Tersedia dengan sisa delapan porsi
2. Coba filter kategori **Minuman** dan kolom cari, lalu kembalikan ke **Semua**
3. Di dashboard kasir, catat delapan porsi Mie Jebew Original
4. Segarkan website. Menu berubah menjadi Habis dan laporan menampilkan omzet Rp80.000
5. Di dashboard bahan, tambah seratus gram Bumbu Chili Oil. Menu kembali Tersedia dengan sisa enam porsi
6. Buat pre-order dari ponsel. Tautan WhatsApp admin terbuka dengan pesan yang sudah rapi

---

## Struktur Proyek

```
jebew/
├── app/
│   ├── admin/
│   │   ├── (panel)/           # halaman dashboard yang dilindungi PIN
│   │   │   ├── bahan/         # kelola bahan baku
│   │   │   ├── kasir/         # pencatatan penjualan
│   │   │   ├── laporan/       # laporan harian
│   │   │   ├── menu/          # menu dan resep
│   │   │   ├── preorder/      # daftar pre-order
│   │   │   ├── layout.tsx     # pengaman halaman admin
│   │   │   └── page.tsx       # ringkasan dashboard
│   │   └── login/             # halaman masuk PIN
│   ├── api/                   # route handler untuk semua operasi data
│   ├── globals.css            # gaya global dan warna identitas
│   ├── layout.tsx             # metadata dan bahasa halaman
│   └── page.tsx               # website konsumen
├── komponen/                  # komponen antarmuka
├── lib/
│   ├── akses.ts               # PIN, sesi, dan pembatasan percobaan
│   ├── database.ts            # koneksi Postgres Supabase dan transaksi
│   ├── format.ts              # format rupiah dan waktu WIB
│   ├── inti.ts                # logika perhitungan porsi tanpa efek samping
│   ├── operasi.ts             # transaksi atomik dan kueri database
│   ├── validasi.ts            # skema validasi sisi server
│   └── wa.ts                  # penyusun pesan dan tautan WhatsApp
├── database/
│   ├── schema.sql             # struktur tabel Postgres
│   └── seed.sql               # data contoh Mie Jebew
├── docs/
│   └── panduan-demo.md        # skenario presentasi dan keterbatasan
├── scripts/
│   ├── siap-supabase.mjs      # menjalankan skema dan seed ke Supabase
│   └── muat-contoh.mjs        # mengganti seluruh data dengan menu terbaru
├── public/assets/             # tanda dan ikon aplikasi
├── tests/                     # pengujian logika inti
├── .github/workflows/ci.yml   # pemeriksaan pada setiap push
├── .env.example               # contoh variabel lingkungan
├── AGENTS.md                  # variabel dan aturan proyek
├── CHANGELOG.md               # riwayat versi
├── LICENSE                    # lisensi MIT
├── README.md                  # dokumentasi proyek
└── SECURITY.md                # cara melaporkan kerentanan
```

---

## Pengembangan

### Menambah bahan dan resep baru

1. Buka dashboard admin, lalu masuk dengan PIN
2. Tambah bahan baru di menu **Bahan baku** beserta satuan dan stok awal
3. Buka menu **Menu & resep**, lalu buat atau ubah menu
4. Tambahkan bahan baru ke daftar resep dengan jumlah per satu porsi
5. Periksa angka porsi yang muncul. Bila nol, berarti salah satu bahan masih kosong

> [!WARNING]
> Berkas di dalam `database/` dijalankan sekali lewat `npm run siap:supabase`. Mengubahnya setelah tabel ada tidak akan mengubah struktur yang sudah terpasang. Buat migrasi baru bila perlu mengubah struktur.

### Mengganti data contoh setelah mengubah menu

1. Ubah isi `database/seed.sql`
2. Jalankan `npm run muat:contoh`
3. Perintah ini menghapus transaksi dan pre-order lama, lalu memasang kembali seluruh menu, bahan, dan resep

> [!CAUTION]
> `npm run muat:contoh` menghapus semua transaksi dan pre-order. Pakai hanya untuk data demo, bukan data yang sudah dipakai untuk pencatatan nyata.

### Menjalankan pengujian

1. Jalankan `npm run verifikasi` di terminal
2. Perintah itu menjalankan pemeriksaan tipe, seluruh pengujian, dan build produksi berurutan
3. Commit hanya bila ketiganya berhasil

---

## Pengujian

Jalankan ini sebelum setiap commit. Semua perintah harus selesai tanpa galat.

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

| Pemeriksaan | Syarat |
|-------------|--------|
| `npm run typecheck` | Tidak ada galat tipe TypeScript |
| `npm test` | Seluruh pengujian logika inti lulus |
| `npm run build` | Build produksi Next.js berhasil |
| `npm audit --audit-level=high` | Nol kerentanan tinggi dan kritis |

Aturan tipe TypeScript ada di `tsconfig.json` dengan mode strict. Pengujian memakai `node:test` bawaan Node.js, tanpa kerangka pengujian tambahan.

---

## Keamanan

Dashboard admin dilindungi PIN yang diverifikasi di server. Sesi disimpan dalam cookie HttpOnly bertanda tangan HMAC. Setiap endpoint admin memeriksa sesi di dalam handler, bukan hanya di antarmuka. Semua masukan divalidasi dengan Zod di server, semua kueri Postgres memakai parameter, dan semua perubahan stok berjalan dalam satu transaksi database.

Akses ke Supabase hanya dari kode server lewat `DATABASE_URL`. Tidak ada kunci database yang dikirim ke browser. Row Level Security aktif pada semua tabel sebagai pertahanan tambahan. Di lingkungan produksi, aplikasi menolak jalan bila `ADMIN_PIN` atau `RAHASIA_SESI` kosong.

Kerentanan dependensi diperiksa di CI pada setiap push. Cara melaporkan temuan ada di [`SECURITY.md`](SECURITY.md).

> [!NOTE]
> Rahasiakan berkas `.env.local` dan jangan pernah memasukkannya ke git. Putar ulang kata sandi database bila connection string pernah terbuka.

---

## Integrasi Berkelanjutan

| Workflow | Fungsi |
|----------|--------|
| `ci.yml` | Menjalankan pemeriksaan tipe, pengujian, audit dependensi, dan build pada setiap push dan pull request |

Setiap perubahan dikerjakan pada branch tersendiri, lalu dikirim sebagai pull request ke `main`. CI menilai setiap push dan pull request. Penggabungan ke `main` hanya dilakukan setelah pemeriksaan hijau. Rilis `v0.1.0` memakai SQLite lokal. Rilis `v0.2.0` memakai Supabase dan Vercel.

---

## FAQ

<details>
<summary><b>Apakah aplikasi ini butuh Supabase atau akun cloud?</b></summary>

Ya. Data disimpan di Supabase Postgres. Kamu perlu satu project Supabase gratis dan `DATABASE_URL` di `.env.local`. Untuk mempublikasikannya, kamu juga perlu akun Vercel.

</details>

<details>
<summary><b>Bagaimana cara mengembalikan data contoh setelah dicoba?</b></summary>

Cara paling aman adalah menjalankan `npm run muat:contoh`, yang menetralkan relasi preorder dan penjualan sebelum menghapus data. Bila memakai SQL Editor manual, kosongkan `item_preorder`, `item_penjualan`, `preorder.penjualan_id`, `penjualan.preorder_id`, `preorder`, lalu `penjualan`, baru jalankan isi `database/seed.sql`.

</details>

<details>
<summary><b>Kenapa menu tiba-tiba berubah menjadi Habis?</b></summary>

Status dihitung dari stok bahan dan resep. Bila salah satu bahan habis, jumlah porsi menjadi nol. Tambah stok bahan penghambat di dashboard untuk mengembalikannya.

</details>

<details>
<summary><b>Apakah pre-order langsung mengurangi stok?</b></summary>

Belum. Stok dipotong saat admin menandai pre-order sebagai selesai. Saat itu pula penjualan dicatat ke laporan harian.

</details>

<details>
<summary><b>Apakah Tahap 2 sudah dikerjakan?</b></summary>

Belum. Repositori ini hanya berisi Tahap 1 atau prototipe. Tahap 2 menunggu persetujuan dan masukan dari mitra.

</details>

---

## Penulis

<div align="center">

| [![Nicolas Dwi Dharma](https://github.com/nekonaru.png?size=100)](https://github.com/nekonaru) |
|:---:|
| **Nicolas Dwi Dharma** |
| [github.com/nekonaru](https://github.com/nekonaru) |

</div>

---

## Disclaimer

Jebew adalah prototipe Tahap 1 yang dibuat untuk tugas PBL Inovasi dan Kewirausahaan. Aplikasi ini belum dirancang untuk pemakaian produksi harian. Fitur seperti autentikasi penuh, pembayaran online, notifikasi WhatsApp otomatis, dan multi-cabang sengaja tidak dibuat pada tahap ini.

---

## Lisensi

Didistribusikan di bawah **Lisensi MIT**. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.
