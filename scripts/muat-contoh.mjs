// Mengganti seluruh data contoh di Supabase dengan isi database/seed.sql.
// Dipakai setelah mengubah menu atau bahan, karena seed biasa hanya jalan saat tabel kosong.
// PERINGATAN: menghapus semua transaksi dan pre-order yang ada.

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
  ssl: lokal ? undefined : { rejectUnauthorized: false },
});

try {
  await klien.connect();
  await klien.query("BEGIN");

  await klien.query("DELETE FROM item_penjualan");
  await klien.query("DELETE FROM penjualan");
  await klien.query("DELETE FROM item_preorder");
  await klien.query("DELETE FROM preorder");
  await klien.query("DELETE FROM resep");
  await klien.query("DELETE FROM menu");
  await klien.query("DELETE FROM bahan");
  await klien.query("DELETE FROM pengaturan");

  const contoh = readFileSync(path.join(process.cwd(), "database", "seed.sql"), "utf8");
  await klien.query(contoh);
  await klien.query("COMMIT");

  console.log("Data contoh berhasil dimuat ulang.");
} catch (kesalahan) {
  await klien.query("ROLLBACK");
  console.error("Gagal memuat data contoh:", kesalahan instanceof Error ? kesalahan.message : kesalahan);
  process.exitCode = 1;
} finally {
  await klien.end();
}
