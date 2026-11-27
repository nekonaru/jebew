// Uji v5.1: zona kirim, bukti bayar, QRIS, meja, dan alur PO.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:51000";
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
catat("health versi 5", sehat.status === 200 && Number(String(JSON.parse(sehat.teks).versi).split(".")[0]) >= 5, String(sehat.status));

const zona = await api("/api/zona-kirim", {
  ...json({ nama: `Dekat${Date.now().toString().slice(-5)}`, tarif: 7500, keterangan: "Uji", aktif: true }, cp),
});
catat("zona kirim dibuat", zona.status === 200, String(zona.status));
const daftarZona = JSON.parse((await api("/api/zona-kirim")).teks).zona ?? [];
const zonaUji = daftarZona.find((z) => Number(z.tarif) === 7500);
catat("zona kirim terbaca publik", Boolean(zonaUji), String(daftarZona.length));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({
    nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
    hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
    preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
    biaya_kirim: "0", qris_teks: "QRIS uji", qris_gambar: "",
  }),
});
const dashboard = await api("/api/dashboard");
catat("QRIS tampil di dashboard", JSON.parse(dashboard.teks).pengaturan.qris_teks === "QRIS uji", String(dashboard.status));

const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const po = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Zona",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`, slot_id: null, catatan: "",
  tipe_pesanan: "kirim", alamat_kirim: "Jalan Uji", zona_id: zonaUji?.id,
}));
const hasilPo = po.status === 201 ? JSON.parse(po.teks) : {};
catat("ongkir mengikuti zona", po.status === 201 && hasilPo.ongkir === 7500,
  `${po.status} ongkir ${hasilPo.ongkir}`);

if (hasilPo.kode_lacak) {
  const gambar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n98AAAAASUVORK5CYII=";
  const bukti = await api("/api/bukti-bayar", json({ kode_lacak: hasilPo.kode_lacak, data_url: gambar }));
  catat("bukti bayar tersimpan", bukti.status === 200, String(bukti.status));
}

const meja = await api("/meja/A3");
catat("halaman pesan dari meja", meja.status === 200, String(meja.status));

const bahan = JSON.parse((await api("/api/bahan", { headers: H })).teks).bahan?.[0];
const supplier = JSON.parse((await api("/api/supplier", { headers: H })).teks).supplier?.[0];
if (bahan && supplier) {
  const poStok = await api("/api/stok-lanjutan", {
    ...json({ aksi: "purchase_order", supplier_id: supplier.id, tanggal: new Date().toISOString().slice(0, 10),
      catatan: "", items: [{ bahan_id: bahan.id, jumlah: 1, harga_satuan: 1000 }] }, cp),
  });
  catat("PO dibuat", poStok.status === 200, String(poStok.status));
  const daftarPO = JSON.parse((await api("/api/stok-lanjutan", { headers: H })).teks).purchaseOrder ?? [];
  const idPO = daftarPO[0]?.id;
  if (idPO) {
    const kirim = await api("/api/stok-lanjutan", {
      ...json({ aksi: "kirim_po", id: Number(idPO) }, cp),
    });
    catat("PO dikirim", kirim.status === 200, String(kirim.status));
  }
}

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ ...p, qris_teks: "", qris_gambar: "" }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
