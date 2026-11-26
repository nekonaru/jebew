// Uji audit putaran keenam: pembatasan peran, WIB, dan kesesuaian slot.
import { jadwalTerbuka } from "./bantu-jadwal.mjs";
const dasar = process.env.URL_UJI ?? "http://localhost:8100";
const hasil = [];
const catat = (nama, lulus, rincian = "") => hasil.push(`${lulus ? "OK" : "??"} ${nama}${rincian ? ": " + rincian : ""}`);

async function api(path, opsi = {}) {
  const r = await fetch(dasar + path, opsi);
  return { status: r.status, teks: await r.text(), cookie: r.headers.get("set-cookie"), headers: r.headers };
}
const json = (badan) => ({
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(badan),
});

const pulihkanJadwal = await jadwalTerbuka(dasar);
const pemilik = await api("/api/auth", json({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }));
const cp = pemilik.cookie?.split(";")[0] ?? "";
const statPemilik = JSON.parse((await api("/api/statistik", { headers: { Cookie: cp } })).teks);
catat("pemilik melihat omzet", typeof statPemilik.omzet === "number", String(statPemilik.omzet));

const kasir = await api("/api/auth", json({ email: "kasir@jebew.test", kata_sandi: "kasir123" }));
const ck = kasir.cookie?.split(";")[0] ?? "";
const Hk = { Cookie: ck };
const statKasir = JSON.parse((await api("/api/statistik", { headers: Hk })).teks);
catat("kasir tanpa data keuangan", !("omzet" in statKasir) && !("nilaiStok" in statKasir) && !("tren" in statKasir));
catat("kasir tetap melihat stok dan preorder", "preorderAktif" in statKasir && "bahanMenipis" in statKasir);
for (const path of ["/api/laporan", "/api/tutup-kasir"]) {
  const r = await api(path, { headers: Hk });
  catat(`kasir ditolak ${path}`, r.status === 403, String(r.status));
}
const beli = JSON.parse((await api("/api/pembelian", { headers: Hk })).teks);
catat("kasir tanpa rincian pembelian", Array.isArray(beli.pembelian) && beli.pembelian.length === 0 && Array.isArray(beli.supplier));
for (const path of ["/admin/laporan", "/admin/keuangan"]) {
  const r = await fetch(dasar + path, { headers: Hk, redirect: "manual" });
  catat(`kasir ditolak ${path}`, r.status === 307 && r.headers.get("location") === "/admin", String(r.status));
}

// Slot harus cocok dengan tanggal dan jam waktu ambil.
const besok = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
await api("/api/slot", {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ tanggal: besok, jam: "12:00", kuota: 5 }),
});
const slot = JSON.parse((await api("/api/slot", { headers: { Cookie: cp } })).teks).slot?.find((s) => s.tanggal === besok && s.jam === "12:00");
if (slot) {
  const salah = await api("/api/preorder", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Slot Salah", whatsapp: "081234567890", waktu_ambil: `${new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)} 12:00`, slot_id: slot.id, catatan: "" }),
  });
  catat("slot beda tanggal ditolak", salah.status === 400, String(salah.status));
  const jamSalah = await api("/api/preorder", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Jam Salah", whatsapp: "081234567890", waktu_ambil: `${besok} 13:00`, slot_id: slot.id, catatan: "" }),
  });
  catat("slot beda jam ditolak", jamSalah.status === 400, String(jamSalah.status));
  const benar = await api("/api/preorder", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Slot Benar", whatsapp: "081234567890", waktu_ambil: `${besok} 12:00`, slot_id: slot.id, catatan: "" }),
  });
  catat("slot sesuai diterima", benar.status === 201, String(benar.status));
}

const jamSlot = await api("/api/slot", {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ tanggal: besok, jam: "9:00", kuota: 5 }),
});
catat("format jam slot valid", jamSlot.status === 400, String(jamSlot.status));
const slotLampau = await api("/api/slot", {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: cp },
  body: JSON.stringify({ tanggal: new Date(Date.now() - 86400000).toISOString().slice(0, 10), jam: "10:00", kuota: 5 }),
});
catat("tanggal slot lampau ditolak", slotLampau.status === 400, String(slotLampau.status));

const menit = await api("/api/preorder", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items: [{ menu_id: 28, varian_id: null, jumlah: 1 }], nama_pelanggan: "Uji Menit", whatsapp: "081234567890", waktu_ambil: `${besok} 12:99`, slot_id: null, catatan: "" }),
});
catat("menit tidak valid ditolak", menit.status === 400, String(menit.status));

await pulihkanJadwal();
console.log(hasil.join("\n"));
console.log(`\nTOTAL: ${hasil.length}, GAGAL: ${hasil.filter((x) => x.startsWith("??")).length}`);
