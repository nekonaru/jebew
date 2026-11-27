// Uji v5.0: bundling, piutang, shift, limbah, halaman promo, dan detail menu.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:48000";
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
catat("health versi", sehat.status === 200 && Number(String(JSON.parse(sehat.teks).versi).split(".")[0]) >= 5, String(sehat.status));

const awal = await api("/api/pengaturan", { headers: H });
const p = JSON.parse(awal.teks);
const badan = {
  nama_usaha: p.nama_usaha, tagline: p.tagline, whatsapp_admin: p.whatsapp_admin,
  hari_buka: p.hari_buka, jam_buka: "00:00", jam_tutup: "23:59", toko_aktif: "true",
  preorder_aktif: "true", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59",
  minimum_preorder: "0", biaya_kirim: "0", bundling_aktif: "true",
  bundling_min: "3", bundling_diskon: "5", batal_batas_menit: "120",
};
await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify(badan),
});

const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const po = await api("/api/preorder", json({
  items: [{ menu_id: 28, varian_id: null, jumlah: 3 }], nama_pelanggan: "Uji Bundling",
  whatsapp: "081234567890", waktu_ambil: `${besok} 18:00`, slot_id: null, catatan: "",
}));
const hasilPo = po.status === 201 ? JSON.parse(po.teks) : {};
catat("bundling memberi diskon", po.status === 201 && hasilPo.total === 11400,
  `${po.status} total ${hasilPo.total}`);

const piutang = await api("/api/operasional", {
  ...json({ aksi: "piutang", kode_lacak: hasilPo.kode_lacak ?? "JBW-TEST", nama: "Uji Piutang",
    jumlah: 50000, jatuh_tempo: besok, catatan: "" }, cp),
});
catat("piutang dibuat", piutang.status === 200, String(piutang.status));
const daftarOp = await api("/api/operasional", { headers: H });
const idPiutang = JSON.parse(daftarOp.teks).piutang?.[0]?.id;
if (idPiutang) {
  const bayar = await api("/api/operasional", {
    ...json({ aksi: "bayar_piutang", id: Number(idPiutang), jumlah: 50000 }, cp),
  });
  catat("piutang dilunasi", bayar.status === 200, String(bayar.status));
}

const shift = await api("/api/operasional", {
  ...json({ aksi: "mulai_shift", nama: "Pagi", kas_awal: 100000 }, cp),
});
catat("shift dimulai", shift.status === 200, String(shift.status));
const daftarShift = JSON.parse((await api("/api/operasional", { headers: H })).teks).shift ?? [];
const idShift = daftarShift[0]?.id;
if (idShift) {
  const selesai = await api("/api/operasional", {
    ...json({ aksi: "selesai_shift", id: Number(idShift), kas_akhir: 150000, catatan: "Sesuai" }, cp),
  });
  catat("shift selesai", selesai.status === 200, String(selesai.status));
}

const bahan = JSON.parse((await api("/api/bahan", { headers: H })).teks).bahan?.[0];
if (bahan) {
  const limbah = await api("/api/operasional", {
    ...json({ aksi: "limbah", bahan_id: bahan.id, jumlah: 1, alasan: "Uji limbah" }, cp),
  });
  catat("limbah tercatat", limbah.status === 200, String(limbah.status));
}

const promo = await api("/promo");
catat("halaman promo publik", promo.status === 200, String(promo.status));
const detail = await api("/menu/28");
catat("halaman detail menu", detail.status === 200, String(detail.status));

await api("/api/pengaturan", {
  method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ ...badan, bundling_aktif: "false" }),
});
await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
