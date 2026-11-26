// Uji regresi audit putaran ketiga dan fitur v1.4.0.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:7100";
const waktuAmbil = `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 18:00`;
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);
const hari = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  return { status: r.status, teks: await r.text(), cookie: r.headers.get("set-cookie"), headers: r.headers };
}
const json = (badan, cookie) => ({
  method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(badan),
});

const login = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
catat("login pemilik", login.status === 200, String(login.status));
const cookie = login.cookie?.split(";")[0] ?? "";
const H = { Cookie: cookie };

// Kasir multi-item: HPP harus menjumlahkan semua item.
const menu = JSON.parse((await api("/api/menu", { headers: H })).teks).menu ?? [];
const pilih = menu.filter((m) => m.aktif && Number(m.hpp) > 0).slice(0, 2);
if (pilih.length === 2) {
  const jual = await api("/api/kasir", json({
    items: pilih.map((m) => ({ menu_id: m.id, varian_id: null, jumlah: 1 })),
    diskon: 0, metode: "tunai", catatan: "uji multi item",
  }, cookie));
  const d = JSON.parse(jual.teks);
  catat("kasir mengembalikan rincian struk", jual.status === 201 && Array.isArray(d.items) && Boolean(d.dibuat_pada), String(jual.status));
  if (jual.status === 201) {
    const lap = JSON.parse((await api(`/api/laporan?dari=${hari}&sampai=${hari}`, { headers: H })).teks);
    const tr = lap.daftar?.find((x) => x.nomor === d.nomor);
    const diharapkan = pilih.reduce((n, m) => n + Number(m.hpp), 0);
    catat("hpp multi item", tr && tr.hpp === diharapkan, `${tr?.hpp ?? "-"} vs ${diharapkan}`);
    const aud = JSON.parse((await api(`/api/audit?tabel=penjualan&cari=${d.nomor}`, { headers: H })).teks);
    catat("filter audit", Array.isArray(aud.audit) && aud.audit.length > 0, `${aud.audit?.length ?? 0}`);
  }
}

// Filter preorder berdasarkan kode atau nama pelanggan.
const pulihkanJadwal = await jadwalTerbuka(dasar);
const nama = `UjiCari${Date.now()}`;
const po = await api("/api/preorder", json({
  items: [{ menu_id: pilih[0]?.id ?? menu[0]?.id, varian_id: null, jumlah: 1 }],
  nama_pelanggan: nama, whatsapp: "081234567890", waktu_ambil: waktuAmbil, slot_id: null, catatan: "",
}, cookie));
catat("buat preorder uji", po.status === 201, String(po.status));
if (po.status === 201) {
  const cari = JSON.parse((await api(`/api/preorder?cari=${nama}`, { headers: H })).teks);
  catat("filter preorder nama", cari.preorder?.length === 1 && cari.preorder[0].nama_pelanggan === nama, `${cari.preorder?.length ?? 0}`);
  const kosong = JSON.parse((await api(`/api/preorder?status=selesai&cari=${nama}`, { headers: H })).teks);
  catat("filter preorder status", Array.isArray(kosong.preorder) && kosong.preorder.length === 0, `${kosong.preorder?.length ?? 0}`);
}

// Tanggal slot ketat dan daftar putih pengaturan publik.
const slot = await api("/api/slot", json({ tanggal: "2026-02-31", jam: "12:00", kuota: 5 }, cookie));
catat("tanggal slot invalid", slot.status === 400, String(slot.status));
const pub = JSON.parse((await api("/api/dashboard")).teks);
const kunciPublik = Object.keys(pub.pengaturan ?? {});
catat("pengaturan publik terbatas", kunciPublik.includes("nama_usaha") && !kunciPublik.includes("kata_sandi"), `${kunciPublik.length} kunci`);

// Kasir tidak bisa membuka halaman khusus pemilik lewat URL langsung.
const kasir = await api("/api/auth", json({ email: "kasir@jebew.test", kata_sandi: "kasir123" }));
const cookieKasir = kasir.cookie?.split(";")[0] ?? "";
for (const path of ["/admin/master", "/admin/pengaturan"]) {
  const r = await fetch(dasar + path, { headers: { Cookie: cookieKasir }, redirect: "manual" });
  catat(`kasir ditolak ${path}`, r.status === 307 && r.headers.get("location") === "/admin", `${r.status} ${r.headers.get("location") ?? ""}`);
}

await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
