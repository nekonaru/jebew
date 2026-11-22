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

**Jebew** adalah prototipe aplikasi untuk UMKM kuliner Mie Jebew. Aplikasi ini menyatukan dua sisi yang memakai satu database: dashboard admin untuk mengelola bahan, resep, kasir, laporan, dan pre-order, serta website konsumen untuk melihat menu yang masih tersedia dan memesan lewat WhatsApp.

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
| **Pembaruan otomatis** | Status menu disegarkan setiap 15 detik tanpa memuat ulang halaman |
| **Pre-order** | Pilih beberapa menu, isi nama, WhatsApp, waktu ambil, dan catatan |
| **Pesan WhatsApp siap kirim** | Tautan wa.me dibuka dengan rincian pesanan dan total yang sudah terformat |
| **Pesanan ditolak bila habis** | Menu yang habis tidak bisa dipilih dan permintaan ditolak di server |

### Aturan Data

| Fitur | Deskripsi |
|-------|-----------|
| **Transaksi atomik** | Pengecekan stok, penyimpanan penjualan, dan pengurangan stok terjadi dalam satu transaksi database |
| **Snapshot harga** | Nama menu dan harga disimpan saat transaksi agar laporan lama tidak berubah |
| **Stok tidak negatif** | Batas database menolak nilai stok di bawah nol |
| **Data contoh** | Tiga menu dan enam bahan siap pakai untuk keperluan demo |

---

## Persyaratan

| Dependensi | Versi Minimum | Catatan |
|------------|---------------|---------|
| **Node.js** | 24 | Dibutuhkan untuk modul `node:sqlite` bawaan |
| **npm** | 11 | Disertakan bersama Node.js 24 |
| **Browser** | Versi terkini | Chrome, Edge, Firefox, atau Safari |
| **Git** | 2.40 | Dibutuhkan hanya untuk mengambil kode sumber |

> [!TIP]
> Aplikasi ini memakai database SQLite lokal. Kamu tidak perlu akun Supabase, kredensial cloud, atau koneksi internet setelah dependensi terpasang.

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

#### 3. Siapkan variabel lingkungan

```bash
cp .env.example .env.local
```

Ubah `ADMIN_PIN`, `RAHASIA_SESI`, dan `WHATSAPP_ADMIN` di berkas `.env.local`. Semua nilai sudah punya bawaan untuk demo, jadi aplikasi tetap bisa jalan tanpa mengubahnya.

> [!IMPORTANT]
> PIN bawaan `1234` hanya untuk demo. Ganti nilainya sebelum aplikasi dipakai di luar keperluan presentasi.

#### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser. Database dan data contoh dibuat otomatis saat halaman pertama dibuka.

---

## Penggunaan

### Pertama kali dibuka

1. Buka `http://localhost:3000` untuk melihat website konsumen
2. Perhatikan status Tersedia pada Mie Jebew Original dengan sisa delapan porsi
3. Buka `http://localhost:3000/admin/login` dan masukkan PIN admin
4. Database lokal tersimpan di `data/jebew.db`. Hapus folder `data` untuk mengembalikan data contoh

> [!NOTE]
> Berkas database tidak masuk git. Setiap orang yang mengambil kode sumber akan mendapat data contoh yang sama.

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
| `ADMIN_PIN` | Tidak | PIN masuk dashboard. Bawaan: `1234` |
| `RAHASIA_SESI` | Tidak | Kunci penandatanganan cookie sesi. Ganti dengan string acak panjang |
| `WHATSAPP_ADMIN` | Tidak | Nomor tujuan pesan pre-order dalam format internasional tanpa tanda plus |
| `NAMA_USAHA` | Tidak | Nama yang tampil di pesan WhatsApp bila pengaturan database kosong |
| `JEBEW_DB` | Tidak | Lokasi berkas database. Bawaan: `data/jebew.db` |

> [!NOTE]
> Nomor WhatsApp admin juga bisa diubah lewat baris `whatsapp_admin` pada berkas `database/seed.sql` sebelum database pertama kali dibuat.

---

## Skenario Demo

Simulasi lima menit untuk presentasi ke dosen dan mitra. Panduan lengkap ada di [`docs/panduan-demo.md`](docs/panduan-demo.md).

1. Tampilkan website konsumen. Mie Jebew Original berstatus Tersedia dengan sisa delapan porsi
2. Di dashboard kasir, catat delapan porsi Mie Jebew Original
3. Segarkan website. Menu berubah menjadi Habis dan laporan harian menampilkan omzet Rp120.000
4. Di dashboard bahan, tambah seratus gram Bumbu. Menu kembali Tersedia
5. Buat pre-order dari ponsel. Tautan WhatsApp admin terbuka dengan pesan yang sudah rapi

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
│   ├── database.ts            # koneksi SQLite lokal
│   ├── format.ts              # format rupiah dan waktu WIB
│   ├── inti.ts                # logika perhitungan porsi tanpa efek samping
│   ├── operasi.ts             # transaksi atomik dan kueri database
│   ├── validasi.ts            # skema validasi sisi server
│   └── wa.ts                  # penyusun pesan dan tautan WhatsApp
├── database/
│   ├── schema.sql             # struktur tabel
│   └── seed.sql               # data contoh Mie Jebew
├── docs/
│   └── panduan-demo.md        # skenario presentasi dan keterbatasan
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
> Berkas di dalam `database/` dipakai saat database pertama kali dibuat. Mengubahnya setelah database ada tidak akan berpengaruh sampai berkas `data/jebew.db` dihapus.

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
| `npm audit --audit-level=high` | Nol kerentanan sedang dan tinggi |

Aturan tipe TypeScript ada di `tsconfig.json` dengan mode strict. Pengujian memakai `node:test` bawaan Node.js, tanpa kerangka pengujian tambahan.

---

## Keamanan

Dashboard admin dilindungi PIN yang dividerifikasi di server. Sesi disimpan dalam cookie HttpOnly bertanda tangan HMAC. Setiap endpoint admin memeriksa sesi di dalam handler, bukan hanya di antarmuka. Semua masukan divalidasi dengan Zod di server, semua kueri memakai parameter, dan semua perubahan stok berjalan dalam transaksi database.

Kerentanan dependensi diperiksa di CI pada setiap push. Cara melaporkan temuan ada di [`SECURITY.md`](SECURITY.md).

> [!NOTE]
> PIN bawaan hanya untuk demo. Rahasiakan berkas `.env.local` dan jangan pernah memasukkannya ke git.

---

## Integrasi Berkelanjutan

| Workflow | Fungsi |
|----------|--------|
| `ci.yml` | Menjalankan pemeriksaan tipe, pengujian, audit dependensi, dan build pada setiap push dan pull request |

Setiap perubahan dikerjakan pada branch tersendiri, lalu dikirim sebagai pull request ke `main`. CI menilai setiap push dan pull request. Penggabungan ke `main` hanya dilakukan setelah pemeriksaan hijau. Prototipe Tahap 1 sudah tergabung dan dirilis sebagai `v0.1.0`.

---

## FAQ

<details>
<summary><b>Apakah aplikasi ini butuh Supabase atau akun cloud?</b></summary>

Tidak. Prototipe memakai SQLite lokal yang tersimpan di `data/jebew.db`. Skema dan data contoh ada di folder `database`.

</details>

<details>
<summary><b>Bagaimana cara mengembalikan data contoh setelah dicoba?</b></summary>

Hentikan aplikasi, hapus folder `data`, lalu jalankan `npm run dev` lagi. Database beserta data contoh akan dibuat ulang otomatis.

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
