// Koneksi database SQLite lokal. Skema dan data contoh dijalankan sekali saat pertama dibuka.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

type GlobalDenganDatabase = typeof globalThis & { __jebewDatabase?: DatabaseSync };

function bukaDatabase(): DatabaseSync {
  const lokasiBerkas =
    process.env.JEBEW_DB ?? path.join(process.cwd(), "data", "jebew.db");
  const folderDatabase = path.join(process.cwd(), "database");

  mkdirSync(path.dirname(lokasiBerkas), { recursive: true });

  const koneksi = new DatabaseSync(lokasiBerkas);
  koneksi.exec(readFileSync(path.join(folderDatabase, "schema.sql"), "utf8"));

  const hasil = koneksi.prepare("SELECT COUNT(*) AS jumlah FROM bahan").get() as {
    jumlah: number;
  };

  if (hasil.jumlah === 0) {
    koneksi.exec(readFileSync(path.join(folderDatabase, "seed.sql"), "utf8"));
  }

  return koneksi;
}

const globalDenganDatabase = globalThis as GlobalDenganDatabase;

export const database = globalDenganDatabase.__jebewDatabase ?? bukaDatabase();
globalDenganDatabase.__jebewDatabase = database;

/** Menjalankan satu unit kerja atomik. bila ada kesalahan, semua perubahan dibatalkan. */
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
