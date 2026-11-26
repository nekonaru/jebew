// Membersihkan tabel pembatasan laju hanya pada database uji.
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const berkasEnv = ".env.local";
const env = {};
if (existsSync(berkasEnv)) {
  for (const b of readFileSync(berkasEnv, "utf8").split(/\r?\n/)) {
    const m = b.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

if (env.NODE_ENV === "production" || process.env.NODE_ENV === "production") {
  console.error("Tolak: perintah ini tidak boleh dijalankan pada lingkungan produksi.");
  process.exit(1);
}
if (!process.argv.includes("--iya")) {
  console.error("Tolak: sertakan argumen --iya untuk mengonfirmasi penghapusan.");
  process.exit(1);
}
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL tidak ditemukan di .env.local.");
  process.exit(1);
}
if (env.IZINKAN_HAPUS_LAJU !== "1") {
  console.error("Tolak: tambahkan IZINKAN_HAPUS_LAJU=1 pada .env.local hanya untuk database uji.");
  process.exit(1);
}

const klien = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: env.DATABASE_TLS_VERIFY !== "false" },
});
try {
  await klien.connect();
  const hasil = await klien.query("DELETE FROM pembatasan_laju");
  console.log("Baris pembatas laju dihapus:", hasil.rowCount);
} finally {
  await klien.end();
}
