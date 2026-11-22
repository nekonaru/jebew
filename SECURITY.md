# Kebijakan Keamanan

## Versi yang Didukung

| Versi | Status |
|-------|--------|
| `v0.1.x` | Didukung sebagai prototipe Tahap 1 |

## Melaporkan Kerentanan

Jangan membuka isu publik untuk laporan kerentanan. Gunakan tab **Security** pada repositori ini, lalu pilih **Report a vulnerability** agar laporan masuk langsung ke pengelola repositori.

Sertakan hal berikut agar laporan mudah diverifikasi:

- Versi aplikasi atau hash commit yang dipakai
- Langkah untuk mereproduksi masalah secara singkat
- Dampak yang kamu lihat, misalnya data yang terbaca atau perubahan yang tidak seharusnya terjadi
- Saran perbaikan bila ada

## Yang Diharapkan

Kami akan menanggapi laporan dalam beberapa hari kerja. Temuan yang dikonfirmasi akan diperbaiki lebih dulu sebelum rilis berikutnya. Pelapor tidak perlu melakukan perbaikan sendiri.

## Batasan Prototipe

PIN bawaan dan kunci sesi bawaan hanya dipakai untuk keperluan demo. Keduanya harus diganti lewat variabel lingkungan sebelum aplikasi dipakai di luar presentasi. Lihat `.env.example` untuk daftar variabelnya.
