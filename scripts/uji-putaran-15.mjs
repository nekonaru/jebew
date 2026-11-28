// Uji v6.2: multi-lokasi, backup, riwayat resep, push, API mitra, dan observability.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:57000";
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);
const json = (badan, cookie) => ({
  method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(badan),
});
async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  return { status: r.status, teks: await r.text(), cookie: r.headers.get("set-cookie") };
}

const pulihkanJadwal = await jadwalTerbuka(dasar);
const masuk = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = masuk.cookie?.split(";")[0] ?? "";
const H = { Cookie: cp };

const sehat = await api("/api/health");
const isiSehat = sehat.status === 200 ? JSON.parse(sehat.teks) : {};
catat("health menyertakan statistik", sehat.status === 200 && Boolean(isiSehat.statistik), String(sehat.status));

const lokasi = await api("/api/lokasi", {
  ...json({ nama: `Cabang Uji ${Date.now().toString().slice(-5)}`, alamat: "Jalan Uji", aktif: true }, cp),
});
catat("lokasi dibuat", lokasi.status === 200, String(lokasi.status));
const daftarLokasi = JSON.parse((await api("/api/lokasi?publik=true")).teks).lokasi ?? [];
const lokasiUji = daftarLokasi.find((l) => String(l.nama).startsWith("Cabang Uji"));
catat("lokasi terbaca publik", Boolean(lokasiUji), String(daftarLokasi.length));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({
    nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
    hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
    preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
    lokasi_aktif: "true",
  }),
});
const tanpaLokasi = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Lokasi",
  whatsapp: "081234567890", waktu_ambil: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 18:00`,
  slot_id: null, catatan: "",
}));
catat("lokasi wajib ditolak", tanpaLokasi.status === 400, String(tanpaLokasi.status));
const denganLokasi = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Lokasi",
  whatsapp: "081234567890", waktu_ambil: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 18:00`,
  slot_id: null, catatan: "", lokasi_id: lokasiUji?.id,
}));
catat("preorder dengan lokasi diterima", denganLokasi.status === 201, String(denganLokasi.status));

const backup = await api("/api/cron/backup", { method: "POST" });
catat("backup cron terlindungi", backup.status === 403, String(backup.status));
const resep = await api("/api/riwayat-resep", { headers: H });
catat("riwayat resep terbaca", resep.status === 200 && Array.isArray(JSON.parse(resep.teks).riwayat), String(resep.status));
const push = await api("/api/push/kunci");
catat("kunci push tersedia", push.status === 200, String(push.status));
const mitra = await api("/api/mitra/menu");
catat("api mitra terlindungi", mitra.status === 401, String(mitra.status));

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ ...p, lokasi_aktif: "false" }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
