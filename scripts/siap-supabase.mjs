// Menyiapkan skema dan data contoh pada database Supabase.
// Jalankan: npm run siap:supabase
// Membutuhkan DATABASE_URL di .env.local atau di lingkungan shell.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Node.js tidak memuat .env.local secara otomatis. Baca variabel proyek bila ada.
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
  console.error("DATABASE_URL belum diatur. Isi dari panel Supabase, bagian Connection string.");
  process.exit(1);
}

const lokal = /localhost|127\.0\.0\.1/.test(url);
const klien = new pg.Client({
  connectionString: url,
  ssl: lokal ? undefined : { rejectUnauthorized: false },
});

try {
  await klien.connect();

  const skema = readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8");
  await klien.query(skema);
  console.log("Skema berhasil diterapkan.");

  const hasil = await klien.query("SELECT COUNT(*) AS jumlah FROM bahan");
  if (Number(hasil.rows[0].jumlah) === 0) {
    const contoh = readFileSync(path.join(process.cwd(), "database", "seed.sql"), "utf8");
    await klien.query(contoh);
    console.log("Data contoh berhasil dimasukkan.");
  } else {
    console.log("Data sudah ada, seed dilewati.");
  }
} catch (kesalahan) {
  console.error("Penyiapan gagal:", kesalahan instanceof Error ? kesalahan.message : kesalahan);
  process.exitCode = 1;
} finally {
  await klien.end();
}
