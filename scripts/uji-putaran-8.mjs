// Uji fitur v3.0.0: kesehatan, promo, poin, status siap, ulasan, jadwal, dan target.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:27000";
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
const sehat = await api("/api/health");
catat("health check", sehat.status === 200 && JSON.parse(sehat.teks).siap === true, String(sehat.status));

const masuk = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = masuk.cookie?.split(";")[0] ?? "";

const kode = `UJI${Date.now().toString().slice(-6)}`;
const hariIni = new Date().toISOString().slice(0, 10);
const promo = await api("/api/promo", {
  ...json({ kode, jenis: "nominal", nilai: 2000, minimum_belanja: 0, kuota: 5,
    berlaku_dari: hariIni, berlaku_sampai: hariIni, aktif: true }, cp),
});
catat("promo dibuat", promo.status === 200, String(promo.status));
const cek = await api("/api/promo/validasi", json({ kode, subtotal: 7000 }));
catat("validasi promo", cek.status === 200 && JSON.parse(cek.teks).diskon === 2000, cek.teks.slice(0, 60));

const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const po = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 1 }],
  nama_pelanggan: "Uji Promo", whatsapp: "081234567890",
  waktu_ambil: `${besok} 18:00`, slot_id: null, catatan: "", kode_promo: kode,
}));
const hasilPo = po.status === 201 ? JSON.parse(po.teks) : {};
const menuPublik = await (await fetch(`${dasar}/api/dashboard`)).json();
const hargaMenu = Number(menuPublik.menu?.find((m) => m.id === 28)?.harga ?? 0);
catat("preorder memakai promo", po.status === 201 && hasilPo.total === hargaMenu - 2000,
  `${po.status} ${hasilPo.total} dari ${hargaMenu}`);

if (hasilPo.kode_lacak) {
  const dapur = await api("/api/preorder", {
    method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
    body: JSON.stringify({ id: JSON.parse((await api("/api/preorder?status=semua", { headers: { Cookie: cp } })).teks)
      .preorder.find((p) => p.kode_lacak === hasilPo.kode_lacak).id, status: "siap" }),
  });
  catat("status siap diterima", dapur.status === 200, String(dapur.status));
  const notif = await api("/api/notifikasi?batas=10", { headers: { Cookie: cp } });
  catat("notifikasi tercatat", notif.status === 200 && JSON.parse(notif.teks).notifikasi.length > 0, String(notif.status));
  const lacak = await api(`/api/lacak?kode=${hasilPo.kode_lacak}`);
  const data = lacak.status === 200 ? JSON.parse(lacak.teks) : {};
  catat("riwayat status tampil", Array.isArray(data.riwayat) && data.riwayat.length >= 2, String(data.riwayat?.length));
  catat("estimasi tersedia", typeof data.estimasi_menit === "number", String(data.estimasi_menit));

  const ulasan = await api("/api/ulasan", json({ kode_lacak: hasilPo.kode_lacak, rating: 5, komentar: "Enak" }));
  catat("ulasan dikirim", ulasan.status === 200, String(ulasan.status));
  const daftarUlasan = await api("/api/ulasan?status=menunggu", { headers: { Cookie: cp } });
  const idUlasan = JSON.parse(daftarUlasan.teks).ulasan?.[0]?.id;
  if (idUlasan) {
    const tinjau = await api("/api/ulasan", {
      method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
      body: JSON.stringify({ id: idUlasan, status: "diterima" }),
    });
    catat("ulasan ditinjau", tinjau.status === 200, String(tinjau.status));
  }
}

const jadwal = await api("/api/jadwal-harian");
catat("jadwal harian terbaca", jadwal.status === 200, String(jadwal.status));
const simpanJadwal = await api("/api/jadwal-harian", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({
    jadwal: [0, 1, 2, 3, 4, 5, 6].flatMap((hari) => [
      { jenis: "toko", hari, jam_buka: "09:00", jam_tutup: "22:00", aktif: true },
      { jenis: "preorder", hari, jam_buka: "09:00", jam_tutup: "22:00", aktif: true },
    ]), libur: [], hapusLibur: [],
  }),
});
catat("jadwal harian disimpan", simpanJadwal.status === 200, String(simpanJadwal.status));

const target = await api("/api/target", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ tanggal: hariIni, target_omzet: 500000, target_transaksi: 20 }),
});
catat("target disimpan", target.status === 200, String(target.status));
const bacaTarget = await api(`/api/target?dari=${hariIni}&sampai=${hariIni}`, { headers: { Cookie: cp } });
catat("target terbaca", bacaTarget.status === 200 && JSON.parse(bacaTarget.teks).target.length > 0, String(bacaTarget.status));

const stokAwal = await api("/api/stok-lanjutan", { headers: { Cookie: cp } });
catat("stok lanjutan terbaca", stokAwal.status === 200 && Array.isArray(JSON.parse(stokAwal.teks).prediksi), String(stokAwal.status));
const daftarBahan = JSON.parse((await api("/api/bahan", { headers: { Cookie: cp } })).teks).bahan ?? [];
const daftarSupplier = JSON.parse((await api("/api/supplier", { headers: { Cookie: cp } })).teks).supplier ?? [];
if (daftarBahan[0] && daftarSupplier[0]) {
  const poStok = await api("/api/stok-lanjutan", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
    body: JSON.stringify({ aksi: "purchase_order", supplier_id: daftarSupplier[0].id,
      tanggal: hariIni, catatan: "", items: [{ bahan_id: daftarBahan[0].id, jumlah: 1, harga_satuan: 1000 }] }),
  });
  catat("purchase order dibuat", poStok.status === 200, String(poStok.status));
  const daftarPO = JSON.parse((await api("/api/stok-lanjutan", { headers: { Cookie: cp } })).teks).purchaseOrder ?? [];
  const idPO = daftarPO[0]?.id;
  if (idPO) {
    const terima = await api("/api/stok-lanjutan", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
      body: JSON.stringify({ aksi: "terima", id: Number(idPO) }),
    });
    catat("purchase order diterima", terima.status === 200, String(terima.status));
  }
}

await api("/api/jadwal-harian", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({
    jadwal: [0, 1, 2, 3, 4, 5, 6].flatMap((hari) => [
      { jenis: "toko", hari, jam_buka: "10:00", jam_tutup: "21:00", aktif: true },
      { jenis: "preorder", hari, jam_buka: "10:00", jam_tutup: "21:00", aktif: true },
    ]), libur: [], hapusLibur: [],
  }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
