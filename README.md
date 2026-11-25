<div align="center">
  <img src="public/assets/jebew-mark.png" alt="Tanda Jebew" width="110" />
  <h1>Mie Jebew: Sistem Kelola Warung Kak Ikaa</h1>
  <p><b>Stok, resep, kasir, keuangan, dan pre-order untuk Mie Jebew Chili Oil<br/>
  dan Wonton Ayam Chili Oil dalam satu sistem.</b></p>

  <p>
    <a href="https://jebew-nu.vercel.app"><img src="https://img.shields.io/badge/Live-Prototipe-C2412C?style=for-the-badge" alt="Buka prototipe" /></a>
    <a href="https://jebew-final.vercel.app"><img src="https://img.shields.io/badge/Live-Produk%20Jadi-24613F?style=for-the-badge" alt="Buka produk jadi" /></a>
  </p>

  <a href="https://github.com/nekonaru/jebew/releases"><img src="https://img.shields.io/github/v/release/nekonaru/jebew?style=flat-square&color=blue" alt="Rilis" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Lisensi-MIT-green?style=flat-square" alt="Lisensi" />
</div>

<br />

> [!NOTE]
> Repositori ini menyimpan dua versi. Cabang `main` adalah prototipe Tahap 1 yang sudah beku. Cabang `final` adalah produk jadi Tahap 2. Keduanya punya database dan deploy terpisah supaya bisa ditunjukkan berdampingan.

---

## Daftar Isi

- [Tentang](#tentang)
- [Demo Langsung](#demo-langsung)
- [Dua Versi](#dua-versi)
- [Fitur Final](#fitur-final)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Akun Demo](#akun-demo)
- [Penggunaan](#penggunaan)
- [Struktur Proyek](#struktur-proyek)
- [Keamanan](#keamanan)
- [Pengujian](#pengujian)
- [Integrasi Berkelanjutan](#integrasi-berkelanjutan)
- [Lisensi](#lisensi)

---

## Tentang

**Jebew** adalah sistem manajemen untuk **Warung Kak Ikaa**, penjual Mie Jebew Chili Oil dan Wonton Ayam Chili Oil. Sistem ini menghubungkan dapur, kasir, keuangan, dan pemesanan pelanggan dalam satu database.

Inti sistem ada pada resep. Setiap menu menyimpan bahan dan jumlah per porsi. Jumlah porsi yang bisa dibuat dihitung dari stok terkecil, dan HPP dihitung dari harga rata rata bahan. Saat transaksi dicatat, stok berkurang otomatis lewat satu transaksi database.

---

## Demo Langsung

Kedua versi bisa dibuka langsung tanpa instalasi:

| Versi | Website konsumen | Dashboard admin |
|-------|------------------|-----------------|
| Prototipe Tahap 1 | [jebew-nu.vercel.app](https://jebew-nu.vercel.app) | `/admin`, PIN `1234` |
| Produk Jadi Tahap 2 | [jebew-final.vercel.app](https://jebew-final.vercel.app) | `/login`, `pemilik@jebew.test` / `pemilik123` |

> [!TIP]
> Gunakan dua tab berdampingan untuk membandingkan alur pre-order di prototipe dan di produk jadi.

---

## Dua Versi

| Versi | Cabang | Database | Fokus |
|-------|--------|----------|-------|
| Prototipe Tahap 1 | `main` | Supabase `jebew` | Alur utama, PIN, tiga menu awal |
| Produk Jadi Tahap 2 | `final` | Supabase `jebew-final` | Login dan peran, stok lengkap, keuangan, pre-order penuh |

Keduanya memakai repo yang sama tetapi Vercel project berbeda. Jangan menggabungkan `final` ke `main` karena akan menghilangkan versi prototipe.

---

## Fitur Final

### Akses dan keamanan

| Fitur | Deskripsi |
|-------|-----------|
| **Login email dan sandi** | Kata sandi di-hash dengan scrypt, sesi ditandatangani HMAC, dan tombol mata untuk menampilkan atau menyembunyikan sandi |
| **Dua peran** | Pemilik mengelola seluruh data dan keuangan, Kasir memakai kasir serta melihat stok, pre-order, dan riwayat transaksi |
| **Sesi selalu segar** | Status dan peran pengguna diperiksa ulang dari database pada setiap permintaan |
| **Row Level Security** | Aktif pada semua tabel. Akses aplikasi memakai peran server, jadi aturan akses utama ada di lapisan API |
| **Audit log** | Setiap perubahan menu, stok, uang, master data, dan transaksi tercatat, dengan filter aksi, data, kata kunci, dan unduhan CSV |

### Stok dan pembelian

| Fitur | Deskripsi |
|-------|-----------|
| **Riwayat pergerakan** | Semua stok masuk, keluar, penyesuaian, dan rusak tercatat |
| **Pembelian** | Supplier, harga beli, dan harga rata rata diperbarui otomatis |
| **Stock opname** | Input stok fisik, selisih, dan alasan |
| **Peringatan stok** | Bahan menipis ditandai di dashboard beserta jumlah, batas, dan tombol kirim WhatsApp |
| **Master data** | Kelola supplier dan kategori pengeluaran, serta lihat total pembelian per supplier |
| **Konversi satuan** | Hitung kg ke gram, liter ke ml, dan lusin ke pcs |

### Keuangan

| Fitur | Deskripsi |
|-------|-----------|
| **HPP dan margin** | Dihitung otomatis dari resep dan harga bahan, lalu disimpan per transaksi |
| **Pengeluaran** | Kategori gas, listrik, sewa, gaji, dan lainnya |
| **Laporan** | Omzet, HPP, laba kotor, laba bersih, laba per menu, grafik harian, dan ringkasan cetak |
| **Omzet 7 hari** | Grafik batang di dashboard tanpa pustaka grafik tambahan |
| **Nilai stok** | Total nilai bahan aktif pada dashboard |
| **Menu paling laku** | Lima menu terlaris tujuh hari terakhir beserta omzetnya |
| **Ekspor CSV** | Unduh rincian transaksi untuk rentang tanggal tertentu |
| **Cadangan JSON** | Unduh dan pulihkan seluruh data induk serta turunan tanpa kata sandi pengguna |
| **Tutup kasir** | Rekonsiliasi kas fisik terhadap tunai, QRIS, dan transfer |

### Penjualan dan pre-order

| Fitur | Deskripsi |
|-------|-----------|
| **Kasir** | Pilih menu dan varian, diskon, metode bayar, catatan, dan struk yang bisa dicetak |
| **Varian** | Level pedas dan topping punya harga dan resep sendiri |
| **Pre-order** | Pilih slot waktu dengan kuota, kirim pesan WhatsApp siap pakai, dan saring pesanan berdasarkan status, nama, atau tanggal |
| **Riwayat transaksi** | Cari berdasarkan nomor atau menu, lihat dan cetak rinciannya, serta unduh CSV |
| **Lacak pesanan** | Halaman publik memakai kode lacak |
| **Notifikasi** | Pesan WhatsApp terformat otomatis setelah pre-order dibuat |

### Website konsumen

| Fitur | Deskripsi |
|-------|-----------|
| **Menu dan filter** | Cari menu, pilih kategori, lihat status dan sisa porsi |
| **Panduan pesan** | Tiga langkah singkat sebelum daftar menu |
| **Tanya jawab** | Pertanyaan umum tentang pemesanan, jam ambil, dan pelacakan |
| **Pemberitahuan keranjang** | Konfirmasi singkat saat menu masuk keranjang |
| **Jam operasional** | Admin bisa membuka atau menutup toko dan mengatur jam |
| **Pembaruan berkala** | Status menyegarkan setiap 15 detik |

---

## Persyaratan

| Dependensi | Minimum | Catatan |
|------------|---------|---------|
| **Node.js** | 24 | Versi pengembangan dan CI |
| **npm** | 11 | Termasuk bersama Node.js |
| **Supabase** | Project gratis | Satu untuk prototipe, satu untuk final |
| **Vercel** | Akun gratis | Satu project per versi |

---

## Instalasi

### Menjalankan versi final secara lokal

```bash
git clone https://github.com/nekonaru/jebew.git
cd jebew
git checkout final
npm ci
cp .env.example .env.local
```

Isi `DATABASE_URL` dari Supabase project final, `RAHASIA_SESI`, dan `WHATSAPP_ADMIN`. Verifikasi sertifikat TLS database aktif secara bawaan. Bila lingkungan lokal memakai proksi dengan sertifikat mandiri, tambahkan `DATABASE_TLS_VERIFY=false` pada `.env.local`. Lalu:

```bash
npm run siap:supabase
npm run dev
```

Buka `http://localhost:3000` untuk website konsumen dan `http://localhost:3000/login` untuk admin.

> [!IMPORTANT]
> `npm run siap:supabase` memasang skema dan data contoh. Perintah `npm run muat:contoh` mengganti seluruh data demo, termasuk menghapus transaksi yang sudah ada. Untuk database yang sudah berisi data, jalankan `npm run db:migrasi` agar kolom HPP per transaksi tersedia tanpa menghapus data.

### Deploy ke Vercel

Buat project Vercel baru yang menarik repo ini dengan branch produksi `final`. Isi environment variables `DATABASE_URL`, `RAHASIA_SESI`, dan `WHATSAPP_ADMIN`. Nama usaha diatur lewat halaman Pengaturan. Project lama tetap memantau `main` untuk prototipe.

---

## Akun Demo

| Peran | Email | Kata sandi |
|-------|-------|------------|
| Pemilik | `pemilik@jebew.test` | `pemilik123` |
| Kasir | `kasir@jebew.test` | `kasir123` |

Akun demo ini hanya untuk prototipe. Jangan menjalankan `npm run siap:supabase` atau `npm run muat:contoh` pada database produksi. Untuk mengganti kata sandi di luar demo, kirim `PUT /api/pengguna` dengan `kata_sandi` baru atau ubah data seed sebelum penyimpanan produksi disiapkan.

---

## Penggunaan

### Skenario singkat

1. Masuk sebagai pemilik, lalu buka **Bahan & Stok** untuk menambah stok atau mencatat pembelian
2. Buka **Menu & Resep**, perhatikan angka porsi dan HPP yang dihitung otomatis
3. Buka **Kasir**, pilih Mie Jebew Original dengan varian Level 2, isi jumlah dan metode bayar
4. Buka **Laporan**, lihat omzet, HPP, laba, dan unduh CSV
5. Dari website konsumen, buat pre-order dengan memilih slot, lalu salin tautan WhatsApp
6. Kembali ke **Pre-order** di admin dan tekan **Selesaikan** untuk mencatat penjualan

---

## Struktur Proyek

```
jebew/
├── app/
│   ├── admin/                 # kasir, stok, menu, laporan, preorder, keuangan, pengaturan
│   ├── api/                   # endpoint data dan autentikasi
│   ├── lacak/                 # halaman lacak pesanan konsumen
│   ├── login/                 # halaman masuk
│   └── page.tsx               # website konsumen
├── komponen/
│   ├── final/                 # antarmuka versi final
│   └── api-klien.ts           # pembantu respons API
├── lib/
│   ├── final/                 # menu, stok, transaksi, laporan, pengaturan
│   ├── auth.ts                # hash sandi dan sesi
│   ├── audit.ts               # jejak aktivitas
│   ├── database.ts            # koneksi Postgres dan transaksi
│   ├── format.ts              # rupiah dan waktu WIB
│   ├── inti-final.ts          # logika murni porsi dan HPP
│   └── wa.ts                  # pesan WhatsApp
├── database/                  # skema dan data contoh final
├── scripts/                   # siap:supabase, db:migrasi, muat:contoh, dan uji API
├── tests/                     # pengujian logika inti
├── .github/workflows/ci.yml   # CI untuk main dan final
└── README.md
```

---

## Keamanan

Sesi disimpan dalam cookie HttpOnly bertanda tangan HMAC. Kata sandi memakai scrypt dengan garam acak. Setiap endpoint admin memeriksa sesi dan peran di server. Semua kueri Postgres memakai parameter, dan perubahan stok berjalan dalam transaksi dengan pembaruan bersyarat.

Akses database hanya dari server lewat `DATABASE_URL`. Tidak ada kunci database di browser. RLS aktif pada semua tabel dan aplikasi memakai peran server, sehingga pemeriksaan akses dilakukan di API. Cara melaporkan kerentanan ada di [`SECURITY.md`](SECURITY.md).

> [!NOTE]
> Mode notifikasi WhatsApp dan pembayaran QRIS memakai simulasi untuk keperluan demo. Alur dan datanya berjalan, tetapi tidak terhubung ke penyedia berbayar.

---

## Pengujian

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

| Pemeriksaan | Syarat |
|-------------|--------|
| `npm run typecheck` | Tanpa galat tipe |
| `npm test` | Seluruh pengujian lulus |
| `npm run build` | Build produksi berhasil |
| `npm audit --audit-level=high` | Nol kerentanan tinggi dan kritis |

Uji seluruh endpoint dengan server berjalan:

```bash
URL_UJI=http://localhost:3000 npm run uji:api
URL_UJI=http://localhost:3000 node scripts/uji-fitur-baru.mjs
URL_UJI=http://localhost:3000 node scripts/uji-putaran-2.mjs
URL_UJI=http://localhost:3000 node scripts/uji-putaran-3.mjs
URL_UJI=http://localhost:3000 node scripts/uji-putaran-4.mjs
URL_UJI=http://localhost:3000 node scripts/uji-putaran-5.mjs
```

Skrip `uji:api` membuat satu penjualan dan satu pre-order uji, jadi jalankan hanya pada database demo.

---

## Integrasi Berkelanjutan

CI berjalan pada push ke `main` dan `final`, pull request, serta tag `v*` dan `final-v*`. Rilis prototipe memakai awalan `v`, rilis final memakai awalan `final-v`.

---

## Lisensi

Didistribusikan di bawah **Lisensi MIT**. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.
