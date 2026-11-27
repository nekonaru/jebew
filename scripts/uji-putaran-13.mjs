// Uji v6.0: keuangan lanjutan, PPN, flash sale, ulasan foto, dan survei.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:53000";
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
catat("health versi 6", sehat.status === 200 && Number(String(JSON.parse(sehat.teks).versi).split(".")[0]) >= 6, String(sehat.status));

const keuangan = await api("/api/keuangan-lanjutan", { headers: H });
const isiKeuangan = keuangan.status === 200 ? JSON.parse(keuangan.teks) : {};
catat("keuangan lanjutan terbaca", keuangan.status === 200
  && Array.isArray(isiKeuangan.kas) && Array.isArray(isiKeuangan.rfm), String(keuangan.status));

const anggaran = await api("/api/keuangan-lanjutan", {
  ...json({ aksi: "anggaran", kategori: "Uji", bulan: new Date().toISOString().slice(0, 7), jumlah: 100000 }, cp),
});
catat("anggaran tersimpan", anggaran.status === 200, String(anggaran.status));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
const dasarPengaturan = {
  nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
  hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
  preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
  minimum_preorder: "0", biaya_kirim: "0", ppn_aktif: "true", ppn_persen: "10",
};
await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(dasarPengaturan),
});
const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const po = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji PPN",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`, slot_id: null, catatan: "",
}));
const hasilPo = po.status === 201 ? JSON.parse(po.teks) : {};
catat("PPN dihitung server", po.status === 201 && hasilPo.total === 4400,
  `${po.status} total ${hasilPo.total}`);
catat("pesan memuat PPN", String(hasilPo.pesan ?? "").includes("PPN:"), String(po.status));

const kodePromo = `FLASH${Date.now().toString().slice(-5)}`;
const promo = await api("/api/promo", {
  ...json({ kode: kodePromo, jenis: "nominal", nilai: 1000, minimum_belanja: 0, kuota: 5,
    berlaku_dari: new Date().toISOString().slice(0, 10), berlaku_sampai: new Date().toISOString().slice(0, 10),
    aktif: true, jam_mulai: "00:00", jam_selesai: "23:59" }, cp),
});
catat("promo jam dibuat", promo.status === 200, String(promo.status));
const validasi = await api("/api/promo/validasi", json({ kode: kodePromo, subtotal: 7000 }));
catat("promo jam aktif divalidasi", validasi.status === 200 && JSON.parse(validasi.teks).diskon === 1000, String(validasi.status));

const gambar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n98AAAAASUVORK5CYII=";
if (hasilPo.kode_lacak) {
  const ulasan = await api("/api/ulasan", json({
    kode_lacak: hasilPo.kode_lacak, rating: 5, komentar: "Enak", foto: gambar,
  }));
  catat("ulasan dengan foto diterima", ulasan.status === 200, String(ulasan.status));
  const survei = await api("/api/survei", json({
    kode_lacak: hasilPo.kode_lacak, nilai: 5, komentar: "Mudah",
  }));
  catat("survei diterima", survei.status === 200, String(survei.status));
}

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ ...dasarPengaturan, ppn_aktif: "false", ppn_persen: "0" }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
