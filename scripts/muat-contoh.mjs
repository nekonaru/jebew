// Mengganti seluruh data dengan isi database/seed.sql.
// PERINGATAN: menghapus semua transaksi, pre-order, dan aktivitas demo.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const berkasEnv = path.join(process.cwd(), ".env.local");
if (existsSync(berkasEnv)) {
  for (const baris of readFileSync(berkasEnv, "utf8").split(/\r?\n/)) {
    const cocok = baris.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (cocok && !process.env[cocok[1]]) {
      process.env[cocok[1]] = cocok[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diatur.");
  process.exit(1);
}

const lokal = /localhost|127\.0\.0\.1/.test(url);
const klien = new pg.Client({
  connectionString: url,
  ssl: lokal ? undefined : { rejectUnauthorized: process.env.DATABASE_TLS_VERIFY !== "false" },
});

const URUTAN_HAPUS = [
  "item_penjualan", "item_preorder", "item_pembelian", "item_opname", "item_varian",
  "riwayat_status_preorder", "notifikasi", "promo_pemakaian", "poin_mutasi", "ulasan",
  "item_purchase_order", "purchase_order", "supplier_harga",
  "log_audit", "tutup_kasir", "pengeluaran", "pergerakan_stok", "batch_bahan",
  "penjualan", "preorder", "pembelian", "stok_opname", "resep", "varian",
  "menu", "bahan", "slot_waktu", "supplier", "konversi_satuan",
  "jadwal_harian", "hari_libur", "target_harian", "totp_secret", "push_subscription", "sesi_aktif", "piutang", "shift", "zona_kirim", "anggaran", "survei", "resep_log", "langganan", "artikel",
  "promo", "poin_pelanggan", "kategori_pengeluaran", "pengguna", "pengaturan", "pembatasan_laju",
];

try {
  await klien.connect();
  await klien.query("BEGIN");
  for (const tabel of URUTAN_HAPUS) {
    await klien.query(`DELETE FROM ${tabel}`);
  }
  await klien.query(readFileSync(path.join(process.cwd(), "database", "seed.sql"), "utf8"));
  await klien.query("COMMIT");
  console.log("Data contoh berhasil dimuat ulang.");
} catch (kesalahan) {
  await klien.query("ROLLBACK");
  console.error("Gagal memuat data contoh:", kesalahan instanceof Error ? kesalahan.message : kesalahan);
  process.exitCode = 1;
} finally {
  await klien.end();
}
