// Uji v4.1: minimum preorder, biaya kirim, metode bayar, batch, dan pengingat.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:42000";
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
catat("health versi", sehat.status === 200 && Number(String(JSON.parse(sehat.teks).versi).split(".")[0]) >= 4, String(sehat.status));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
const badan = (tambahan = {}) => ({
  nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
  hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
  preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
  minimum_preorder: "0", biaya_kirim: "0", ...tambahan,
});
await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(badan({ minimum_preorder: "100000", biaya_kirim: "5000" })),
});
const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const poDasar = {
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Minimum",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`,
  slot_id: null, catatan: "",
};
const ditolak = await api("/api/preorder", json(poDasar));
catat("minimum preorder ditolak", ditolak.status === 400, String(ditolak.status));

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(badan({ biaya_kirim: "5000" })),
});
const kirim = await api("/api/preorder", json({
  ...poDasar, tipe_pesanan: "kirim", alamat_kirim: "Jalan Uji 1",
  metode_bayar: "transfer", bukti_bayar: "REF123",
}));
const hasilKirim = kirim.status === 201 ? JSON.parse(kirim.teks) : {};
catat("ongkir dan transfer diterima", kirim.status === 201 && hasilKirim.ongkir === 5000,
  `${kirim.status} ongkir ${hasilKirim.ongkir}`);
catat(" pesan memuat metode".trim(), hasilKirim.pesan?.includes("Metode bayar: transfer") === true, String(kirim.status));

const bahan = JSON.parse((await api("/api/bahan", { headers: H })).teks).bahan?.[0];
if (bahan) {
  const batch = await api("/api/stok-lanjutan", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
    body: JSON.stringify({
      aksi: "batch", bahan_id: bahan.id, nomor_batch: `UJI${Date.now().toString().slice(-5)}`,
      tanggal_masuk: new Date().toISOString().slice(0, 10), tanggal_kedaluwarsa: "",
      jumlah: 1, harga_satuan: 1000,
    }),
  });
  catat("batch ditambahkan", batch.status === 200, String(batch.status));
  const daftarBatch = await api("/api/stok-lanjutan", { headers: H });
  catat("batch terbaca", daftarBatch.status === 200
    && Array.isArray(JSON.parse(daftarBatch.teks).batch), String(daftarBatch.status));
}

const cron = await api("/api/cron/pengingat", { method: "POST" });
catat("pengingat tanpa token ditolak", cron.status === 403, String(cron.status));

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(badan()),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
