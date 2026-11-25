// Terapkan migrasi pada database yang sudah berjalan tanpa menghapus data.
// Jalankan: npm run db:migrasi

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

try {
  await klien.connect();
  const sql = readFileSync(path.join(process.cwd(), "database", "migrasi.sql"), "utf8");
  await klien.query(sql);
  console.log("Migrasi berhasil diterapkan.");
} catch (kesalahan) {
  console.error("Migrasi gagal:", kesalahan instanceof Error ? kesalahan.message : kesalahan);
  process.exitCode = 1;
} finally {
  await klien.end();
}
