// Uji beban ringan: 100 permintaan publik paralel ke endpoint dashboard.
const dasar = process.env.URL_UJI ?? "http://localhost:57000";
const jumlah = Math.min(500, Math.max(10, Number(process.env.JUMLAH ?? 100)));
const mulai = Date.now();
const hasil = [];
for (let i = 0; i < jumlah; i += 10) {
  const kumpulan = Array.from({ length: Math.min(10, jumlah - i) },
    () => fetch(`${dasar}/api/dashboard`));
  hasil.push(...await Promise.allSettled(kumpulan));
}
const sukses = hasil.filter((h) => h.status === "fulfilled" && h.value.ok).length;
const gagal = hasil.length - sukses;
const detik = (Date.now() - mulai) / 1000;
console.log(`PERMINTAAN: ${jumlah}, SUKSES: ${sukses}, GAGAL: ${gagal}, WAKTU: ${detik.toFixed(2)} detik`);
if (gagal > 0) process.exitCode = 1;
