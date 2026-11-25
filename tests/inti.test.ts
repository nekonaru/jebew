import test from "node:test";
import assert from "node:assert/strict";
import {
  batasiDiskon, cekStokCukup, hargaRataRata, hitungHpp, hitungPorsi, hppBaris, hppPerTransaksi, margin, ringkasKeuangan, totalDenganDiskon,
  type InfoBahan, type ItemResep,
} from "../lib/inti-final.ts";
import { formatRupiah, tanggalHariIni, tanggalParameter, tanggalValid } from "../lib/format.ts";
import { susunPesanWhatsApp, tautanWhatsApp } from "../lib/wa.ts";

const bahan: InfoBahan[] = [
  { id: 1, nama: "Mie", satuan: "gram", stok: 2000, harga_rata_rata: 12 },
  { id: 2, nama: "Bumbu Chili Oil", satuan: "gram", stok: 120, harga_rata_rata: 85 },
  { id: 3, nama: "Telur", satuan: "butir", stok: 60, harga_rata_rata: 3000 },
];
const resep: ItemResep[] = [
  { bahanId: 1, jumlahPerPorsi: 100 },
  { bahanId: 2, jumlahPerPorsi: 15 },
  { bahanId: 3, jumlahPerPorsi: 1 },
];

test("porsi memakai bahan penghambat", () => {
  const hasil = hitungPorsi(resep, bahan);
  assert.equal(hasil.porsi, 8);
  assert.equal(hasil.penghambat?.nama, "Bumbu Chili Oil");
});

test("porsi dibulatkan ke bawah", () => {
  const hasil = hitungPorsi([{ bahanId: 2, jumlahPerPorsi: 30 }], [
    { id: 2, nama: "Bumbu", satuan: "gram", stok: 80 },
  ]);
  assert.equal(hasil.porsi, 2);
});

test("resep kosong menghasilkan nol porsi", () => {
  assert.equal(hitungPorsi([], bahan).porsi, 0);
});

test("bahan tidak ditemukan dianggap kosong", () => {
  const hasil = hitungPorsi([{ bahanId: 99, jumlahPerPorsi: 1 }], bahan);
  assert.equal(hasil.porsi, 0);
});

test("cek stok cukup dan kurang", () => {
  assert.equal(cekStokCukup(resep, 8, bahan).cukup, true);
  const kurang = cekStokCukup(resep, 10, bahan);
  assert.equal(kurang.cukup, false);
  assert.equal(kurang.kekurangan[0].nama, "Bumbu Chili Oil");
});

test("hpp dihitung dari resep dan harga rata rata", () => {
  const hpp = hitungHpp(resep, bahan);
  assert.equal(hpp, 100 * 12 + 15 * 85 + 1 * 3000);
});

test("margin per menu", () => {
  const hasil = margin(10000, 5475);
  assert.equal(hasil.laba, 4525);
  assert.ok(Math.abs(hasil.persen - 45.25) < 0.01);
});

test("diskon tidak membuat total negatif", () => {
  assert.equal(totalDenganDiskon(20000, 3000), 17000);
  assert.equal(totalDenganDiskon(20000, 25000), 0);
});

test("hpp baris dikalikan jumlah porsi", () => {
  assert.equal(hppBaris(5000, 5), 25000);
  assert.equal(hppBaris(5000, 1), 5000);
  assert.equal(hppBaris(-1, 5), 0);
});

test("harga rata rata memakai bobot stok nyata", () => {
  assert.equal(hargaRataRata(10, 1000, 10, 2000), 1500);
  assert.equal(hargaRataRata(0, 9000, 5, 2000), 2000);
});

test("hpp transaksi menjumlahkan semua item", () => {
  const hasil = hppPerTransaksi([
    { id: 1, hpp: 5000, jumlah: 2 },
    { id: 1, hpp: 3000, jumlah: 1 },
    { id: 2, hpp: 2000, jumlah: 3 },
  ]);
  assert.equal(hasil.get(1), 13000);
  assert.equal(hasil.get(2), 6000);
});

test("diskon dibatasi sampai subtotal", () => {
  assert.equal(batasiDiskon(20000, 25000), 20000);
  assert.equal(batasiDiskon(20000, -500), 0);
  assert.equal(batasiDiskon(20000, 3000), 3000);
});

test("ringkasan keuangan menghitung laba", () => {
  const hasil = ringkasKeuangan([
    { total: 20000, diskon: 0, metode: "tunai", hpp: 8000 },
    { total: 10000, diskon: 0, metode: "qris", hpp: 5000 },
  ], 3000);
  assert.equal(hasil.omzet, 30000);
  assert.equal(hasil.hpp, 13000);
  assert.equal(hasil.labaKotor, 17000);
  assert.equal(hasil.labaBersih, 14000);
  assert.equal(hasil.perMetode.qris, 10000);
});

test("tanggal kalender divalidasi ketat", () => {
  assert.equal(tanggalValid("2026-11-25"), true);
  assert.equal(tanggalValid("2026-02-31"), false);
  assert.equal(tanggalValid("xxxx-xx-xx"), false);
  assert.equal(tanggalValid("2026-13-45"), false);
});

test("parameter tanggal kosong memakai cadangan", () => {
  assert.equal(tanggalParameter("", "2026-11-01"), "2026-11-01");
  assert.equal(tanggalParameter(null, "2026-11-01"), "2026-11-01");
  assert.equal(tanggalParameter("2026-11-25", "2026-11-01"), "2026-11-25");
  assert.equal(tanggalParameter("2026-13-45", "2026-11-01"), "");
});

test("format rupiah dan tanggal", () => {
  assert.equal(formatRupiah(15000), "Rp\u00A015.000");
  assert.match(tanggalHariIni(), /^\d{4}-\d{2}-\d{2}$/);
});

test("pesan whatsapp memakai nomor admin", () => {
  const pesan = susunPesanWhatsApp({
    kode: "JBW-ABC / 1234",
    namaPelanggan: "Siti",
    whatsapp: "081234567890",
    waktuAmbil: "2026-11-25 18:00",
    catatan: "Level 2",
    items: [{ namaMenu: "Es Teh", hargaSatuan: 4000, jumlah: 2 }],
    namaUsaha: "Warung Kak Ikaa",
  });
  assert.match(pesan, /Warung Kak Ikaa/);
  assert.match(pesan, /Total: Rp\u00A08\.000/);
  const tautan = tautanWhatsApp("6282173282591", pesan);
  assert.match(tautan, /^https:\/\/wa\.me\/6282173282591\?text=/);
});
