// Uji fitur v2.13.0: slot massal, sesi tercabut, batas body, dan antrean lacak.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:26000";
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

function tambahHari(teks, jumlah) {
  const t = new Date(`${teks}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + jumlah);
  return t.toISOString().slice(0, 10);
}

const pulihkanJadwal = await jadwalTerbuka(dasar);
const masuk = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = masuk.cookie?.split(";")[0] ?? "";
catat("login pemilik", masuk.status === 200, String(masuk.status));
const H = { Cookie: cp };

const dari = tambahHari(new Date().toISOString().slice(0, 10), 3);
const sampai = tambahHari(dari, 1);
const massal = await api("/api/slot/massal", {
  ...json({
    dari, sampai, jam_mulai: "12:00", jam_selesai: "14:00", interval: 60, kuota: 5,
    hari: [0, 1, 2, 3, 4, 5, 6],
  }, cp),
});
catat("slot massal dibuat", massal.status === 200 && JSON.parse(massal.teks).dibuat === 4, massal.teks.slice(0, 60));

const daftar = JSON.parse((await api("/api/slot", { headers: H })).teks).slot ?? [];
const dibuat = daftar.filter((s) => s.tanggal >= dari && s.tanggal <= sampai && ["12:00", "13:00"].includes(s.jam));
catat("slot massal terbaca", dibuat.length === 4, String(dibuat.length));

const terpakai = dibuat.find((s) => s.jam === "12:00");
if (terpakai) {
  const po = await api("/api/preorder", json({
    items: [{ menu_id: 28, varian_id: null, jumlah: 1 }],
    nama_pelanggan: "Uji Slot Massal", whatsapp: "081234567890",
    waktu_ambil: `${terpakai.tanggal} 12:00`, slot_id: terpakai.id, catatan: "",
  }));
  catat("preorder memakai slot massal", po.status === 201, String(po.status));
  const kode = po.status === 201 ? JSON.parse(po.teks).kode_lacak : "";
  const lacak = await api(`/api/lacak?kode=${kode}`);
  catat("lacak menyertakan antrean", lacak.status === 200 && typeof JSON.parse(lacak.teks).antrean === "number", String(lacak.status));

  await api("/api/slot", json({ tanggal: terpakai.tanggal, jam: terpakai.jam, kuota: 10 }, cp));
  await api("/api/preorder", json({
    items: [{ menu_id: 28, varian_id: null, jumlah: 1 }],
    nama_pelanggan: "Uji Slot Massal 2", whatsapp: "081234567890",
    waktu_ambil: `${terpakai.tanggal} 12:00`, slot_id: terpakai.id, catatan: "",
  }));
  const kecil = await api("/api/slot", json({
    tanggal: terpakai.tanggal, jam: terpakai.jam, kuota: 1,
  }, cp));
  catat("kuota di bawah terisi ditolak", kecil.status === 400, String(kecil.status));

  const hapusDipakai = await api(`/api/slot/${terpakai.id}`, { method: "DELETE", headers: H });
  catat("slot terpakai tidak dihapus", hapusDipakai.status === 409, String(hapusDipakai.status));
}
const kosong = dibuat.find((s) => s.jam === "13:00");
if (kosong) {
  const hapus = await api(`/api/slot/${kosong.id}`, { method: "DELETE", headers: H });
  catat("slot kosong dihapus", hapus.status === 200, String(hapus.status));
}

const kebablasan = await api("/api/slot/massal", {
  ...json({
    dari, sampai: tambahHari(dari, 30), jam_mulai: "08:00", jam_selesai: "22:00", interval: 30, kuota: 5,
    hari: [0, 1, 2, 3, 4, 5, 6],
  }, cp),
});
catat("slot massal berlebih ditolak", kebablasan.status === 400, String(kebablasan.status));

const email = `uji-sesi-${Date.now()}@jebew.test`;
const tambah = await api("/api/pengguna", json({
  email, nama: "Uji Sesi", kata_sandi: "kataSandilama", peran: "kasir", aktif: true,
}, cp));
catat("pengguna uji dibuat", tambah.status === 201, String(tambah.status));
if (tambah.status === 200) {
  const daftarUser = JSON.parse((await api("/api/pengguna", { headers: H })).teks).pengguna ?? [];
  const id = daftarUser.find((u) => u.email === email)?.id;
  const masukUser = await api("/api/auth", json({ email, kata_sandi: "kataSandilama" }));
  const cu = masukUser.cookie?.split(";")[0] ?? "";
  catat("pengguna uji masuk", masukUser.status === 200, String(masukUser.status));
  const ubah = await api("/api/pengguna", {
    method: "PUT", headers: { "Content-Type": "application/json", Cookie: cp },
    body: JSON.stringify({ id, data: { email, nama: "Uji Sesi", kata_sandi: "kataSandiBaru", peran: "kasir", aktif: true } }),
  });
  catat("kata sandi diubah", ubah.status === 200, String(ubah.status));
  const sesiLama = await api("/api/auth", { headers: { Cookie: cu } });
  catat("sesi lama dicabut", sesiLama.status === 200 && JSON.parse(sesiLama.teks).masuk === false, String(sesiLama.status));
  const masukBaru = await api("/api/auth", json({ email, kata_sandi: "kataSandiBaru" }));
  catat("kata sandi baru berhasil", masukBaru.status === 200, String(masukBaru.status));
  if (id) await api(`/api/pengguna?id=${id}`, { method: "DELETE", headers: H });
}

const besar = await api("/api/preorder", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    items: [{ menu_id: 28, varian_id: null, jumlah: 1 }],
    nama_pelanggan: "Uji Besar", whatsapp: "081234567890",
    waktu_ambil: `${tambahHari(new Date().toISOString().slice(0, 10), 2)} 18:00`,
    slot_id: null, catatan: "x".repeat(200 * 1024),
  }),
});
catat("body besar ditolak", besar.status === 413, String(besar.status));

await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
