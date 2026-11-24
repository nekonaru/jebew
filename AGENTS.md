# Proyek

| Variabel | Nilai |
|----------|-------|
| `PROJECT_NAME` | Jebew |
| `REPO` | `nekonaru/jebew` |
| `AUTHOR_NAME` | Nicolas Dwi Dharma |
| `AUTHOR_GITHUB` | `nekonaru` |
| `PROJECT_KIND` | `web` |
| `STACK` | Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase Postgres, Vercel |
| `PLATFORMS` | Web |
| `MIN_OS` | `n/a` |
| `DEFAULT_BRANCH` | `main` |
| `LICENSE` | MIT |
| `UI_LANGUAGES` | Bahasa Indonesia |
| `VERIFICATION` | `local-and-ci` |
| `PIPELINE` | `pr` |

## Catatan proyek

- Proyek ini adalah tugas PBL Inovasi dan Kewirausahaan. Seluruh kode, komentar, dokumen, metadata, pesan commit, catatan rilis, dan antarmuka memakai **Bahasa Indonesia**. Ini adalah pengecualian eksplisit dari aturan dwibahasa Dev Tools yang ditetapkan pemilik proyek.
- Cabang `main` adalah **Tahap 1 (Prototipe)** dan sudah beku di `v0.3.1`. Jangan mengubahnya.
- Cabang `final` adalah **Tahap 2 (Produk Jadi)**. Keduanya sengaja dipertahankan untuk keperluan demo berdampingan.
- Deploy: Vercel project lama memantau `main`. Vercel project baru memantau `final`. Supabase juga terpisah untuk tiap versi.
- Database memakai Supabase Postgres. Koneksi hanya dari kode server lewat `DATABASE_URL`. Skema dan data contoh ada di folder `database/` dan dipasang lewat `npm run siap:supabase`.
- Deploy target adalah Vercel. Variabel produksi wajib diisi: `DATABASE_URL`, `RAHASIA_SESI`, `WHATSAPP_ADMIN`. Versi final memakai login email dan kata sandi, bukan PIN.
- Warna identitas berasal dari lembar identitas logo yang disediakan pemilik proyek: merah bata `#D8432B`, oranye `#F29A2E`, krem `#FFF1D6`, coklat tua `#3A2218`, hijau `#2E9E5B`.
- Tipografi yang dimaksud: Poppins Medium untuk judul dan Inter Regular untuk isi. Font diambil dari sistem bila tersedia agar aplikasi tetap jalan tanpa unduhan luar jaringan.
- Zona waktu yang dipakai adalah WIB (`Asia/Jakarta`).

## Aturan kerja

- Jalankan `npm run verifikasi` sebelum setiap commit. Perintah ini menjalankan pemeriksaan tipe, seluruh pengujian, dan build produksi.
- Commit dan push ke branch kerja, lalu buat pull request ke `main`. Penggabungan dilakukan setelah CI hijau.
- Pesan commit memakai format `tipe: deskripsi singkat` dalam Bahasa Indonesia.
- Berkas lokal yang tidak boleh masuk git: `SECURITY_MAP.md`, `SECURITY_REVIEW.md`, `SECURITY_REPORT.md`, `rancangan.md`, dan semua berkas Dev Tools.
