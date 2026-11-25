// Uji asap seluruh endpoint. Jalankan setelah server berjalan:
// npm run uji:api URL_UJI=http://localhost:3000
const dasar = process.env.URL_UJI ?? "http://localhost:3000";
const waktuAmbil = `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 18:00`;
const hasil = [];
const catat = (nama, status, aman = true) => hasil.push(`${aman ? "OK" : "??"} ${nama}: ${status}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  let isi = "";
  try { isi = await r.text(); } catch {}
  return { status: r.status, isi, cookie: r.headers.get("set-cookie") };
}

// Publik
for (const path of ["/", "/login", "/lacak", "/api/dashboard", "/api/slot"]) {
  const r = await api(path);
  catat(`publik ${path}`, r.status, r.status === 200);
}
const lacakKosong = await api("/api/lacak?kode=");
catat("lacak kode pendek", lacakKosong.status, lacakKosong.status === 400);
const lacakSalah = await api("/api/lacak?kode=TIDAKADA");
catat("lacak tidak ada", lacakSalah.status, lacakSalah.status === 404);

// Autentikasi
const loginSalah = await api("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "pemilik@jebew.test", kata_sandi: "salahsalah" }) });
catat("login salah", loginSalah.status, loginSalah.status === 401);
const loginBenar = await api("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }) });
catat("login pemilik", loginBenar.status, loginBenar.status === 200);
const cookie = loginBenar.cookie?.split(";")[0] ?? "";
const H = { "Content-Type": "application/json", Cookie: cookie };

// Endpoint admin GET
for (const path of ["/api/bahan", "/api/menu", "/api/preorder", "/api/pengeluaran", "/api/tutup-kasir", "/api/pengguna", "/api/audit", "/api/slot", "/api/stok", "/api/pembelian", "/api/opname", "/api/laporan?dari=2026-11-25&sampai=2026-11-25"]) {
  const r = await api(path, { headers: H });
  catat(`admin ${path}`, r.status, r.status === 200);
}

// Endpoint publik tanpa cookie harus ditolak
for (const path of ["/api/bahan", "/api/menu", "/api/preorder", "/api/pengguna", "/api/audit"]) {
  const r = await api(path);
  catat(`tanpa auth ${path}`, r.status, r.status === 401 || r.status === 403);
}

// Kasir
const jual = await api("/api/kasir", { method: "POST", headers: H, body: JSON.stringify({ items: [{ menu_id: 1, varian_id: 2, jumlah: 1 }], diskon: 0, metode: "tunai", catatan: "audit" }) });
catat("kasir", jual.status, jual.status === 201);
const jualGagal = await api("/api/kasir", { method: "POST", headers: H, body: JSON.stringify({ items: [{ menu_id: 1, varian_id: 2, jumlah: -1 }], diskon: 0, metode: "tunai", catatan: "" }) });
catat("kasir jumlah negatif", jualGagal.status, jualGagal.status === 400);
const jualEkstra = await api("/api/kasir", { method: "POST", headers: H, body: JSON.stringify({ items: [{ menu_id: 1, varian_id: 2, jumlah: 1 }], diskon: 0, metode: "tunai", catatan: "", peran: "pemilik" }) });
catat("kasir field ekstra", jualEkstra.status, jualEkstra.status === 400);

// Preorder
const po = await api("/api/preorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Audit", whatsapp: "081234567890", waktu_ambil: waktuAmbil, slot_id: null, catatan: "" }) });
catat("preorder", po.status, po.status === 201);
if (po.status === 201) {
  const data = JSON.parse(po.isi);
  const lacak = await api(`/api/lacak?kode=${data.kode_lacak}`);
  catat("lacak hasil", lacak.status, lacak.status === 200);
  const daftar = await api("/api/preorder", { headers: H });
  const poId = JSON.parse(daftar.isi).preorder[0]?.id;
  if (poId) {
    const selesai = await api("/api/preorder", { method: "PUT", headers: H, body: JSON.stringify({ id: poId, status: "selesai" }) });
    catat("selesaikan preorder", selesai.status, selesai.status === 200);
    const ulang = await api("/api/preorder", { method: "PUT", headers: H, body: JSON.stringify({ id: poId, status: "selesai" }) });
    catat("selesaikan ulang", ulang.status, ulang.status === 400);
  }
}

// Laporan
const laporan = await api("/api/laporan?dari=2026-11-25&sampai=2026-11-25", { headers: H });
catat("laporan", laporan.status, laporan.status === 200);
const laporanBuruk = await api("/api/laporan?dari=2026-11-30&sampai=2026-11-20", { headers: H });
catat("laporan tanggal terbalik", laporanBuruk.status, laporanBuruk.status === 400);
const csv = await api("/api/laporan?dari=2026-11-25&sampai=2026-11-25&format=csv", { headers: H });
catat("ekspor CSV", csv.status, csv.status === 200 && csv.isi.includes("Nomor"));

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
