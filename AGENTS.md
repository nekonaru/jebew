# Proyek

| Variabel | Nilai |
|----------|-------|
| `PROJECT_NAME` | Jebew |
| `REPO` | `nekonaru/jebew` |
| `AUTHOR_NAME` | Nicolas Dwi Dharma |
| `AUTHOR_GITHUB` | `nekonaru` |
| `PROJECT_KIND` | `web` |
| `STACK` | Next.js 15 (App Router), TypeScript, Tailwind CSS, SQLite bawaan Node 24 |
| `PLATFORMS` | Web |
| `MIN_OS` | `n/a` |
| `DEFAULT_BRANCH` | `main` |
| `LICENSE` | MIT |
| `UI_LANGUAGES` | Bahasa Indonesia |
| `VERIFICATION` | `local-and-ci` |
| `PIPELINE` | `pr` |

## Catatan proyek

- Proyek ini adalah tugas PBL Inovasi dan Kewirausahaan. Seluruh kode, komentar, dokumen, metadata, pesan commit, catatan rilis, dan antarmuka memakai **Bahasa Indonesia**. Ini adalah pengecualian eksplisit dari aturan dwibahasa Dev Tools yang ditetapkan pemilik proyek.
- Ruang lingkup yang dikerjakan hanya **Tahap 1 (Prototipe)**. Tahap 2 (Produk Jadi) tidak dikerjakan tanpa persetujuan tertulis dari pemilik proyek.
- Database memakai `node:sqlite` dengan berkas lokal di `data/jebew.db`. Prototipe harus bisa jalan dengan satu perintah tanpa akun, kredensial, atau jaringan. Skema dan data contoh ada di folder `database/`.
- Warna identitas berasal dari lembar identitas logo yang disediakan pemilik proyek: merah bata `#D8432B`, oranye `#F29A2E`, krem `#FFF1D6`, coklat tua `#3A2218`, hijau `#2E9E5B`.
- Tipografi yang dimaksud: Poppins Medium untuk judul dan Inter Regular untuk isi. Font diambil dari sistem bila tersedia agar aplikasi tetap jalan tanpa unduhan luar jaringan.
- Zona waktu yang dipakai adalah WIB (`Asia/Jakarta`).

## Aturan kerja

- Jalankan `npm run verifikasi` sebelum setiap commit. Perintah ini menjalankan pemeriksaan tipe, seluruh pengujian, dan build produksi.
- Commit dan push ke `origin/feat/prototipe` setelah setiap unit kerja selesai.
- Pesan commit memakai format `tipe: deskripsi singkat` dalam Bahasa Indonesia.
- Berkas lokal yang tidak boleh masuk git: `SECURITY_MAP.md`, `SECURITY_REVIEW.md`, `SECURITY_REPORT.md`, `rancangan.md`, dan semua berkas Dev Tools.
