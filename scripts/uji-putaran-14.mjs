// Uji v6.1: privasi data, barcode, langganan, artikel, sitemap, dan webhook.
const dasar = process.env.URL_UJI ?? "http://localhost:55000";
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

const sehat = await api("/api/health");
catat("health versi 6", sehat.status === 200 && Number(String(JSON.parse(sehat.teks).versi).split(".")[0]) >= 6, String(sehat.status));

const masuk = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = masuk.cookie?.split(";")[0] ?? "";
const H = { Cookie: cp };

const privasi = await api("/api/privasi?whatsapp=081234567890");
catat("ekspor data pelanggan", privasi.status === 200 && Array.isArray(JSON.parse(privasi.teks).preorder), String(privasi.status));
const hapus = await api("/api/privasi?konfirmasi=HAPUS", {
  method: "DELETE", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ whatsapp: "081299999999" }),
});
catat("anonimisasi data", hapus.status === 200, String(hapus.status));

const bahan = JSON.parse((await api("/api/bahan", { headers: H })).teks).bahan?.[0];
if (bahan) {
  const kode = `BC${Date.now().toString().slice(-6)}`;
  const simpan = await api("/api/barcode", { ...json({ bahan_id: bahan.id, kode }, cp) });
  catat("barcode disimpan", simpan.status === 200, String(simpan.status));
  const cari = await api(`/api/barcode?kode=${kode}`, { headers: H });
  catat("barcode ditemukan", cari.status === 200 && JSON.parse(cari.teks).bahan?.id === bahan.id, String(cari.status));
}

const menu = JSON.parse((await api("/api/menu", { headers: H })).teks).menu?.[0];
if (menu) {
  const langganan = await api("/api/langganan", {
    ...json({ nama: "Uji Langganan", whatsapp: "081234567890", menu_id: menu.id,
      jumlah: 10, hari: [1, 2, 3, 4, 5], jam: "12:00", aktif: true }, cp),
  });
  catat("langganan dibuat", langganan.status === 200, String(langganan.status));
  const daftar = await api("/api/langganan", { headers: H });
  catat("langganan terbaca", daftar.status === 200 && Array.isArray(JSON.parse(daftar.teks).langganan), String(daftar.status));
}

const judul = `Artikel Uji ${Date.now().toString().slice(-5)}`;
const artikel = await api("/api/artikel", { ...json({ judul, isi: "Isi artikel uji.", aktif: true }, cp) });
catat("artikel dibuat", artikel.status === 200, String(artikel.status));
const artikelPublik = await api("/api/artikel?publik=true");
catat("artikel publik terbaca", artikelPublik.status === 200
  && JSON.parse(artikelPublik.teks).artikel.some((a) => a.judul === judul), String(artikelPublik.status));
const halamanArtikel = await api("/artikel");
catat("halaman artikel tampil", halamanArtikel.status === 200 && halamanArtikel.teks.includes(judul), String(halamanArtikel.status));

const sitemap = await api("/sitemap.xml");
catat("sitemap memuat menu", sitemap.status === 200 && sitemap.teks.includes("/menu/"), String(sitemap.status));

const kedaluwarsa = await api("/api/cron/kedaluwarsa", { method: "POST" });
catat("cron kedaluwarsa terlindungi", kedaluwarsa.status === 403, String(kedaluwarsa.status));

const webhook = await api("/api/webhook/whatsapp", json({
  entry: [{ changes: [{ value: { messages: [{ text: { body: "A1B2C3D4" }, from: "081234567890" }] } }] }],
}));
catat("webhook membalas kode", webhook.status === 200 && JSON.parse(webhook.teks).dijawab === true, String(webhook.status));

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
