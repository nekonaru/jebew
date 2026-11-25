// Uji audit putaran kelima belas: peran, wildcard, batas, dan master data.
const dasar = process.env.URL_UJI ?? "http://localhost:9400";
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  return { status: r.status, teks: await r.text(), cookie: r.headers.get("set-cookie") };
}
const json = (badan, cookie) => ({
  method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(badan),
});

const pemilik = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = pemilik.cookie?.split(";")[0] ?? "";
const kasir = await api("/api/auth", json({ email: "kasir@jebew.test", kata_sandi: "kasir123" }));
const ck = kasir.cookie?.split(";")[0] ?? "";

const bp = JSON.parse((await api("/api/bahan", { headers: { Cookie: cp } })).teks);
const bk = JSON.parse((await api("/api/bahan", { headers: { Cookie: ck } })).teks);
catat("ringkasan nilai hanya pemilik", Boolean(bp.ringkasan) && !bk.ringkasan);

const dup = await api("/api/kategori", json({ nama: "Gas" }, cp));
catat("kategori duplikat ditolak", dup.status === 400, String(dup.status));
const desimal = await api("/api/supplier?id=1.5", { method: "DELETE", headers: { Cookie: cp } });
catat("id desimal ditolak", desimal.status === 400, String(desimal.status));
const tidakAda = await api("/api/supplier?id=999999", { method: "DELETE", headers: { Cookie: cp } });
catat("supplier tidak ada 404", tidakAda.status === 404, String(tidakAda.status));

const dari = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const sampai = new Date().toISOString().slice(0, 10);
const wild = await api(`/api/riwayat?dari=${dari}&sampai=${sampai}&cari=%25`, { headers: { Cookie: cp } });
const wj = JSON.parse(wild.teks);
catat("wildcard escaped pada riwayat", wild.status === 200 && (wj.daftar?.length ?? 0) === 0, `${wj.daftar?.length ?? 0}`);

const csv = await api("/api/audit?format=csv", { headers: { Cookie: cp } });
catat("ekspor audit tersedia", csv.status === 200 && csv.teks.includes("Waktu,Aksi,Data"), String(csv.status));

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
