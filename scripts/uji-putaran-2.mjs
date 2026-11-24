// Uji regresi audit putaran kedua: HPP, tanggal, master data, email, lacak, dan cadangan.
const dasar = process.env.URL_UJI ?? "http://localhost:6900";
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  const teks = await r.text();
  return { status: r.status, teks, cookie: r.headers.get("set-cookie") };
}

const json = (badan, cookie) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(badan),
});

const login = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
catat("login pemilik", login.status === 200, String(login.status));
const cookie = login.cookie?.split(";")[0] ?? "";
const H = { Cookie: cookie };

// HPP laporan harus dikalikan jumlah porsi.
const menuRes = await api("/api/menu", { headers: H });
const menu = JSON.parse(menuRes.teks).menu?.find((m) => Number(m.hpp) > 0 && m.aktif);
if (menu) {
  const jual = await api("/api/kasir", json({ items: [{ menu_id: menu.id, varian_id: null, jumlah: 2 }], diskon: 0, metode: "tunai", catatan: "uji hpp" }, cookie));
  if (jual.status === 201) {
    const nomor = JSON.parse(jual.teks).nomor;
    const hari = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const lap = await api(`/api/laporan?dari=${hari}&sampai=${hari}`, { headers: H });
    const tr = JSON.parse(lap.teks).daftar?.find((d) => d.nomor === nomor);
    catat("hpp laporan dikalikan porsi", tr && tr.hpp === Number(menu.hpp) * 2, `${tr?.hpp ?? "-"} vs ${Number(menu.hpp) * 2}`);
  } else catat("hpp laporan dikalikan porsi", false, `kasir ${jual.status}`);
}

// Tanggal kalender tidak valid harus ditolak 400.
const tanggalCases = [
  ["/api/laporan?dari=2026-02-31&sampai=2026-03-01", "GET"],
  ["/api/pembelian", "POST"],
  ["/api/opname", "POST"],
  ["/api/pengeluaran", "POST"],
  ["/api/tutup-kasir", "POST"],
];
for (const [path, metode] of tanggalCases) {
  const opsi = metode === "GET" ? { headers: H } : json({ tanggal: "2026-02-31" }, cookie);
  const r = await api(path, opsi);
  catat(`tanggal invalid ${path}`, r.status === 400, String(r.status));
}

// Master data supplier dan kategori.
const suplier = await api("/api/supplier", json({ nama: "Uji Supplier", kontak: "0812", aktif: true }, cookie));
catat("tambah supplier", suplier.status === 201, String(suplier.status));
const sid = JSON.parse(suplier.teks).id;
if (sid) {
  const ubah = await api("/api/supplier", { method: "PUT", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ id: sid, nama: "Uji Supplier Ubah", kontak: "0813", aktif: false }) });
  catat("ubah supplier", ubah.status === 200, String(ubah.status));
  const hapus = await api(`/api/supplier?id=${sid}`, { method: "DELETE", headers: H });
  catat("hapus supplier", hapus.status === 200, String(hapus.status));
}
const kat = await api("/api/kategori", json({ nama: "Uji Kategori" }, cookie));
catat("tambah kategori", kat.status === 201, String(kat.status));
const kid = JSON.parse(kat.teks).id;
if (kid) {
  const ubah = await api("/api/kategori", { method: "PUT", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ id: kid, nama: "Uji Kategori Ubah" }) });
  catat("ubah kategori", ubah.status === 200, String(ubah.status));
  const hapus = await api(`/api/kategori?id=${kid}`, { method: "DELETE", headers: H });
  catat("hapus kategori", hapus.status === 200, String(hapus.status));
}
const konv = await api("/api/konversi", { headers: H });
catat("konversi satuan", konv.status === 200 && JSON.parse(konv.teks).konversi?.length > 0, String(konv.status));

// Email dinormalisasi sehingga bisa masuk dengan huruf kecil.
const emailUji = `Uji${Date.now()}@Jebew.Test`;
const user = await api("/api/pengguna", json({ email: emailUji, nama: "Uji", kata_sandi: "uji12345", peran: "kasir", aktif: true }, cookie));
catat("tambah pengguna email kapital", user.status === 201, String(user.status));
const daftarUser = await api("/api/pengguna", { headers: H });
const uid = JSON.parse(daftarUser.teks).pengguna?.find((u) => u.email === emailUji.toLowerCase())?.id;
if (uid) {
  const masuk = await api("/api/auth", json({ email: emailUji.toLowerCase(), kata_sandi: "uji12345" }));
  catat("login email huruf kecil", masuk.status === 200, String(masuk.status));
  const hapus = await api("/api/pengguna", { method: "DELETE", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ id: uid }) });
  catat("hapus pengguna uji", hapus.status === 200, String(hapus.status));
}

// Pengaturan tidak lagi publik.
const pub = await api("/api/pengaturan");
catat("pengaturan tanpa auth", pub.status === 401, String(pub.status));

// Lacak hanya menerima kode lacak.
const lacakKode = await api("/api/lacak?kode=JBWABC");
catat("lacak kode pesanan ditolak", lacakKode.status === 404, String(lacakKode.status));

// Cadangan lengkap dan versi sesuai paket.
const ex = await api("/api/ekspor", { headers: H });
if (ex.status === 200) {
  const d = JSON.parse(ex.teks);
  catat("cadangan memuat tabel turunan", Boolean(d.data?.item_penjualan && d.data?.item_preorder && d.data?.resep && d.data?.tutup_kasir));
  catat("cadangan tanpa kata sandi", !ex.teks.includes("kata_sandi"));
  catat("versi cadangan", typeof d.versi === "string", d.versi);
}

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
