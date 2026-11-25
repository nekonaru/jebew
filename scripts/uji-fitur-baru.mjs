// Uji endpoint fitur baru: statistik, riwayat, dan cadangan data.
const dasar = process.env.URL_UJI ?? "http://localhost:6600";
const hasil = [];
const catat = (nama, status, aman = true) => hasil.push(`${aman ? "OK" : "??"} ${nama}: ${status}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  const teks = await r.text();
  return { status: r.status, teks, cookie: r.headers.get("set-cookie") };
}

for (const path of ["/api/statistik", "/api/riwayat", "/api/ekspor"]) {
  const r = await api(path);
  catat(`tanpa auth ${path}`, r.status, r.status === 401 || r.status === 403);
}

const login = await api("/api/auth", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }),
});
catat("login", login.status, login.status === 200);
const cookie = login.cookie?.split(";")[0] ?? "";
const H = { Cookie: cookie };

const stat = await api("/api/statistik", { headers: H });
const s = JSON.parse(stat.teks);
catat("statistik tren 7 hari", stat.status, stat.status === 200 && s.tren?.length === 7);
catat("statistik bahan menipis", stat.status, Array.isArray(s.bahanMenipis));

const rw = await api("/api/riwayat", { headers: H });
const r = JSON.parse(rw.teks);
catat("riwayat", rw.status, rw.status === 200 && Array.isArray(r.daftar));
const id = r.daftar?.[0]?.id;
if (id) {
  const det = await api(`/api/riwayat?id=${id}`, { headers: H });
  const d = JSON.parse(det.teks);
  catat("rincian transaksi", det.status, det.status === 200 && Array.isArray(d.detail?.items));
}
const buruk = await api("/api/riwayat?dari=2010-01-01&sampai=1999-01-01", { headers: H });
catat("riwayat tanggal terbalik", buruk.status, buruk.status === 400);

const csv = await api("/api/riwayat?format=csv", { headers: H });
catat("ekspor CSV riwayat", csv.status === 200 && csv.teks.includes("Nomor,Waktu,Sumber"), String(csv.status));

const ex = await api("/api/ekspor", { headers: H });
catat("ekspor cadangan", ex.status, ex.status === 200 && ex.teks.includes('"pengguna"') && !ex.teks.includes("kata_sandi"));

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
