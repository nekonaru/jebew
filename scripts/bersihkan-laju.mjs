// Membersihkan tabel pembatasan laju agar uji berulang tidak terkena 429.
import { readFileSync } from "node:fs";
import pg from "pg";

const baris = readFileSync(".env.local", "utf8").split(/\r?\n/);
const env = {};
for (const b of baris) {
  const m = b.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

if (process.env.NODE_ENV === "production" || !process.argv.includes("--iya")) {
  console.error("Tolak: jalankan hanya pada database uji dengan argumen --iya.");
  process.exit(1);
}

const klien = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: env.DATABASE_TLS_VERIFY !== "false" },
});
await klien.connect();
const hasil = await klien.query("DELETE FROM pembatasan_laju");
console.log("Baris pembatas laju dihapus:", hasil.rowCount);
await klien.end();
