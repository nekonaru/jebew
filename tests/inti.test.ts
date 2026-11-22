import test from "node:test";
import assert from "node:assert/strict";
import {
  cekStokCukup,
  hitungPorsi,
  hitungSubtotal,
  hitungTotal,
  ringkasPenjualan,
  type InfoBahan,
} from "../lib/inti.ts";
import { formatRupiah, tanggalHariIni } from "../lib/format.ts";
import { susunPesanWhatsApp, tautanWhatsApp } from "../lib/wa.ts";

const bahanContoh: InfoBahan[] = [
  { id: 1, nama: "Mie", satuan: "gram", stok: 1000 },
  { id: 2, nama: "Bumbu", satuan: "gram", stok: 80 },
  { id: 3, nama: "Telur", satuan: "butir", stok: 15 },
  { id: 4, nama: "Cabai", satuan: "gram", stok: 100 },
];

const resepContoh = [
  { bahanId: 1, jumlahPerPorsi: 100 },
  { bahanId: 2, jumlahPerPorsi: 10 },
  { bahanId: 3, jumlahPerPorsi: 1 },
];

test("hitung porsi memakai bahan penghambat", () => {
  const hasil = hitungPorsi(resepContoh, bahanContoh);
  assert.equal(hasil.porsi, 8);
  assert.equal(hasil.penghambat?.nama, "Bumbu");
  assert.equal(hasil.penghambat?.maksPorsi, 8);
});

test("porsi bulat ke bawah", () => {
  const hasil = hitungPorsi(
    [{ bahanId: 2, jumlahPerPorsi: 30 }],
    [{ id: 2, nama: "Bumbu", satuan: "gram", stok: 80 }],
  );
  assert.equal(hasil.porsi, 2);
});

test("menu tanpa resep tidak bisa dibuat", () => {
  const hasil = hitungPorsi([], bahanContoh);
  assert.equal(hasil.porsi, 0);
  assert.equal(hasil.penghambat, null);
});

test("bahan yang tidak ditemukan dianggap stok kosong", () => {
  const hasil = hitungPorsi([{ bahanId: 99, jumlahPerPorsi: 1 }], bahanContoh);
  assert.equal(hasil.porsi, 0);
  assert.equal(hasil.penghambat?.nama, "Bahan tidak ditemukan");
});

test("stok tidak pernah dianggap negatif", () => {
  const hasil = hitungPorsi(
    [{ bahanId: 1, jumlahPerPorsi: 10 }],
    [{ id: 1, nama: "Mie", satuan: "gram", stok: -5 }],
  );
  assert.equal(hasil.porsi, 0);
});

test("pemeriksaan stok lolos bila cukup", () => {
  const hasil = cekStokCukup(resepContoh, 8, bahanContoh);
  assert.equal(hasil.cukup, true);
  assert.equal(hasil.kekurangan.length, 0);
});

test("pemeriksaan stok menolak dan merinci kekurangan", () => {
  const hasil = cekStokCukup(resepContoh, 10, bahanContoh);
  assert.equal(hasil.cukup, false);
  assert.equal(hasil.kekurangan.length, 1);
  assert.equal(hasil.kekurangan[0].nama, "Bumbu");
  assert.equal(hasil.kekurangan[0].kurang, 20);
});

test("subtotal dan total dihitung dari harga yang disimpan saat transaksi", () => {
  assert.equal(hitungSubtotal(15000, 2), 30000);
  assert.equal(
    hitungTotal([
      { hargaSatuan: 15000, jumlah: 2 },
      { hargaSatuan: 5000, jumlah: 1 },
    ]),
    35000,
  );
});

test("ringkasan laporan menghitung omzet dan menu terlaris", () => {
  const ringkasan = ringkasPenjualan([
    {
      total: 35000,
      items: [
        { namaMenu: "Mie Jebew Original", jumlah: 2 },
        { namaMenu: "Es Teh", jumlah: 1 },
      ],
    },
    {
      total: 15000,
      items: [{ namaMenu: "Mie Jebew Original", jumlah: 1 }],
    },
  ]);
  assert.equal(ringkasan.omzet, 50000);
  assert.equal(ringkasan.jumlahTransaksi, 2);
  assert.equal(ringkasan.menuTerlaris?.nama, "Mie Jebew Original");
  assert.equal(ringkasan.menuTerlaris?.jumlah, 3);
});

test("format rupiah memakai tanda Indonesia", () => {
  assert.equal(formatRupiah(15000), "Rp\u00A015.000");
});

test("tanggal hari ini berformat tanggal biasa", () => {
  assert.match(tanggalHariIni(), /^\d{4}-\d{2}-\d{2}$/);
});

test("pesan WhatsApp berisi rincian dan total", () => {
  const pesan = susunPesanWhatsApp({
    kode: "JBW-ABC123",
    namaPelanggan: "Budi",
    whatsapp: "081234567890",
    waktuAmbil: "2026-11-24 18:00",
    catatan: "Pedas ya",
    items: [{ namaMenu: "Mie Jebew Original", hargaSatuan: 15000, jumlah: 2 }],
    namaUsaha: "Mie Jebew",
  });
  assert.match(pesan, /JBW-ABC123/);
  assert.match(pesan, /Mie Jebew Original x2 = Rp\u00A030\.000/);
  assert.match(pesan, /Total: Rp\u00A030\.000/);
  assert.match(pesan, /Catatan: Pedas ya/);

  const tautan = tautanWhatsApp("62-812-3456-7890", pesan);
  assert.match(tautan, /^https:\/\/wa\.me\/6281234567890\?text=/);
  assert.match(decodeURIComponent(tautan), /JBW-ABC123/);
});
