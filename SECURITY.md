# Kebijakan Keamanan

## Versi yang Didukung

| Versi | Status |
|-------|--------|
| `v0.1.x` | Prototipe Tahap 1 pada cabang `main`, dibekukan |
| `final-v1.x` | Produk jadi pada cabang `final`, didukung |

## Melaporkan Kerentanan

Jangan membuka isu publik untuk laporan kerentanan. Gunakan tab **Security** pada repositori ini, lalu pilih **Report a vulnerability** agar laporan masuk langsung ke pengelola repositori.

Sertakan hal berikut agar laporan mudah diverifikasi:

- Versi aplikasi atau hash commit yang dipakai
- Langkah untuk mereproduksi masalah secara singkat
- Dampak yang kamu lihat, misalnya data yang terbaca atau perubahan yang tidak seharusnya terjadi
- Saran perbaikan bila ada

## Yang Diharapkan

Kami akan menanggapi laporan dalam beberapa hari kerja. Temuan yang dikonfirmasi akan diperbaiki lebih dulu sebelum rilis berikutnya. Pelapor tidak perlu melakukan perbaikan sendiri.

## Kredensial Demo

Akun pemilik dan kasir bawaan pada `database/seed.sql` hanya untuk demo Tahap 1. Jangan menjalankan `npm run siap:supabase` atau `npm run muat:contoh` pada database produksi. Kunci penandatangan sesi wajib diisi lewat `RAHASIA_SESI`, dan nomor WhatsApp admin lewat `WHATSAPP_ADMIN`. Lihat `.env.example` untuk daftar variabelnya.
