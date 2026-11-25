// Uji pemulihan cadangan dan regresi fitur v1.4.0.
const dasar = process.env.URL_UJI ?? "http://localhost:7500";
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  return { status: r.status, teks: await r.text(), cookie: r.headers.get("set-cookie") };
}
const login = await api("/api/auth", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }),
});
catat("login pemilik", login.status === 200, String(login.status));
const cookie = login.cookie?.split(";")[0] ?? "";
const H = { Cookie: cookie };

const ekspor = await api("/api/ekspor", { headers: H });
catat("ekspor cadangan", ekspor.status === 200, String(ekspor.status));
if (ekspor.status === 200) {
  const cadangan = JSON.parse(ekspor.teks);
  const jumlahSebelum = cadangan.data.menu.length;

  const tanpaKonfirmasi = await api("/api/pulihkan", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ konfirmasi: "YA", data: cadangan.data }),
  });
  catat("pulihkan tanpa konfirmasi ditolak", tanpaKonfirmasi.status === 400, String(tanpaKonfirmasi.status));

  const tabelAsing = await api("/api/pulihkan", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ konfirmasi: "PULIHKAN", data: { rahasia: [] } }),
  });
  catat("pulihkan tabel asing ditolak", tabelAsing.status === 400, String(tabelAsing.status));

  const pulih = await api("/api/pulihkan", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ konfirmasi: "PULIHKAN", data: cadangan.data }),
  });
  catat("pulihkan berhasil", pulih.status === 200, String(pulih.status));
  const sesudah = JSON.parse((await api("/api/menu", { headers: H })).teks);
  catat("data menu utuh setelah pulih", sesudah.menu?.length === jumlahSebelum, `${sesudah.menu?.length ?? 0} vs ${jumlahSebelum}`);
}

const kasir = await api("/api/auth", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "kasir@jebew.test", kata_sandi: "kasir123" }),
});
const kasirCookie = kasir.cookie?.split(";")[0] ?? "";
const ditolak = await api("/api/pulihkan", {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: kasirCookie },
  body: JSON.stringify({ konfirmasi: "PULIHKAN", data: {} }),
});
catat("kasir tidak bisa memulihkan", ditolak.status === 403, String(ditolak.status));

console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
