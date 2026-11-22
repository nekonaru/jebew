// Koneksi database SQLite lokal. Skema dan data contoh dijalankan sekali saat pertama dipakai.
// Koneksi sengaja dibuka secara malas agar proses build yang paralel tidak saling mengunci berkas.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

let koneksiTersimpan: DatabaseSync | null = null;

function bukaDatabase(): DatabaseSync {
  if (koneksiTersimpan) return koneksiTersimpan;

  const lokasiBerkas =
    process.env.JEBEW_DB ?? path.join(process.cwd(), "data", "jebew.db");
  const folderDatabase = path.join(process.cwd(), "database");

  mkdirSync(path.dirname(lokasiBerkas), { recursive: true });

  const koneksi = new DatabaseSync(lokasiBerkas);
  koneksi.exec("PRAGMA busy_timeout = 10000");
  koneksi.exec("PRAGMA foreign_keys = ON");
  try {
    koneksi.exec("PRAGMA journal_mode = WAL");
  } catch {
    // WAL bukan keharusan. Mode default tetap berfungsi untuk prototipe.
  }

  koneksi.exec(readFileSync(path.join(folderDatabase, "schema.sql"), "utf8"));

  koneksi.exec("BEGIN IMMEDIATE");
  try {
    const hasil = koneksi.prepare("SELECT COUNT(*) AS jumlah FROM bahan").get() as {
      jumlah: number;
    };
    if (hasil.jumlah === 0) {
      koneksi.exec(readFileSync(path.join(folderDatabase, "seed.sql"), "utf8"));
    }
    koneksi.exec("COMMIT");
  } catch (kesalahan) {
    koneksi.exec("ROLLBACK");
    throw kesalahan;
  }

  koneksiTersimpan = koneksi;
  return koneksi;
}

/**
 * Proxy membuat seluruh pemanggilan `database.*` tetap bekerja, tetapi berkas database
 * hanya dibuka ketika metode pertama benar-benar dipanggil.
 */
export const database: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_sasaran, sifat) {
    const koneksi = bukaDatabase();
    const nilai = Reflect.get(koneksi, sifat);
    return typeof nilai === "function" ? nilai.bind(koneksi) : nilai;
  },
});

/** Menjalankan satu unit kerja atomik. Bila ada kesalahan, semua perubahan dibatalkan. */
export function denganTransaksi<T>(kerja: () => T): T {
  database.exec("BEGIN IMMEDIATE");
  try {
    const hasil = kerja();
    database.exec("COMMIT");
    return hasil;
  } catch (kesalahan) {
    database.exec("ROLLBACK");
    throw kesalahan;
  }
}
