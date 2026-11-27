// Uji fondasi v4: sesi, 2FA, profil, jenis pesanan, auto-batal, dan ulasan publik.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:37000";
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
catat("health check", sehat.status === 200 && String(JSON.parse(sehat.teks).versi).startsWith("4."), String(sehat.status));

const sesi = await api("/api/sesi", { headers: H });
const isiSesi = sesi.status === 200 ? JSON.parse(sesi.teks) : {};
catat("daftar sesi aktif", sesi.status === 200 && Array.isArray(isiSesi.sesi) && isiSesi.sesi.length > 0,
  String(isiSesi.sesi?.length));

const dua = await api("/api/auth/2fa", { headers: H });
catat("status 2FA terbaca", dua.status === 200 && typeof JSON.parse(dua.teks).aktif === "boolean", String(dua.status));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
const badanPengaturan = {
  nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
  hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
  preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
  alamat_usaha: "Jalan Uji", peta_usaha: "https://maps.example/uji",
  deskripsi_usaha: "Warung uji", email_usaha: "uji@jebew.test", instagram_usaha: "@uji",
  logo_url: "", pemeliharaan: "false", banner_judul: "Promo uji", banner_isi: "Diskon hari ini",
  banner_tautan: "https://example.com",
};
const simpan = await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(badanPengaturan),
});
catat("profil usaha tersimpan", simpan.status === 200, String(simpan.status));
const dashboard = await api("/api/dashboard");
catat("banner tampil di publik", dashboard.status === 200
  && JSON.parse(dashboard.teks).pengaturan.banner_judul === "Promo uji", String(dashboard.status));

const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const tanpaMeja = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Meja",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`, slot_id: null,
  catatan: "", tipe_pesanan: "dine_in",
}));
catat("dine-in tanpa meja ditolak", tanpaMeja.status === 400, String(tanpaMeja.status));
const denganMeja = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Meja",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`, slot_id: null,
  catatan: "", tipe_pesanan: "dine_in", meja: "A3", kode_undangan: "UJIUNDANG",
}));
catat("dine-in dengan meja diterima", denganMeja.status === 201, String(denganMeja.status));

const otomatis = await api("/api/preorder/batal-otomatis", { method: "POST", headers: H });
catat("auto-batal berjalan", otomatis.status === 200 && typeof JSON.parse(otomatis.teks).dibatalkan === "number",
  String(otomatis.status));

const ulasan = await api("/api/ulasan/publik");
catat("ulasan publik terbaca", ulasan.status === 200 && Array.isArray(JSON.parse(ulasan.teks).ulasan), String(ulasan.status));

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ ...badanPengaturan, jam_buka: p.jam_buka ?? "10:00", jam_tutup: p.jam_tutup ?? "21:00",
    preorder_jam_buka: p.preorder_jam_buka ?? "10:00", preorder_jam_tutup: p.preorder_jam_tutup ?? "21:00",
    banner_judul: "", banner_isi: "", banner_tautan: "", deskripsi_usaha: "", alamat_usaha: "" }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
