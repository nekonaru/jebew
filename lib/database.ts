// Koneksi Postgres Supabase. Semua akses data terjadi di server, tidak pernah dari browser.
// Transaksi memakai AsyncLocalStorage sehingga setiap kueri di dalam callback otomatis
// memakai koneksi yang sama, tanpa mengubah tanda tangan fungsi di lib/operasi.ts.

import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";

const { Pool } = pg;

// Samakan bentuk nilai tanggal dan bilangan besar supaya lapisan tampilan menerima teks dan angka, bukan objek Date.
pg.types.setTypeParser(1114, (nilai: string) => nilai.split(".")[0]);
pg.types.setTypeParser(1184, (nilai: string) => nilai.split(".")[0]);
// Kolom DATE harus tetap berupa YYYY-MM-DD, bukan objek Date UTC.
pg.types.setTypeParser(1082, (nilai: string) => nilai);
pg.types.setTypeParser(20, (nilai: string) => Number(nilai));

type Pelaksana = Pick<pg.PoolClient, "query">;

const konteksTransaksi = new AsyncLocalStorage<Pelaksana>();

let kumpulan: pg.Pool | null = null;

function dapatkanKumpulan(): pg.Pool {
  if (kumpulan) return kumpulan;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL belum diatur. Isi dari panel Supabase, bagian Database, Connection string.");
  }

  const lokal = /localhost|127\.0\.0\.1/.test(url);
  kumpulan = new Pool({
    connectionString: url,
    // Cukup untuk transaksi paralel ringan sementara kueri biasa tetap bisa masuk pool.
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: lokal ? undefined : { rejectUnauthorized: process.env.DATABASE_TLS_VERIFY !== "false" },
  });

  return kumpulan;
}

async function jalankanKueri(teks: string, nilai: unknown[] = []): Promise<pg.QueryResult> {
  const pelaksana = konteksTransaksi.getStore() ?? dapatkanKumpulan();
  return pelaksana.query(teks, nilai);
}

/** Ambil banyak baris. Parameter memakai penanda $1, $2, dan seterusnya. */
export async function query<T = Record<string, unknown>>(
  teks: string,
  nilai: unknown[] = [],
): Promise<T[]> {
  const hasil = await jalankanKueri(teks, nilai);
  return hasil.rows as T[];
}

/** Ambil satu baris pertama, atau undefined bila tidak ada. */
export async function querySatu<T = Record<string, unknown>>(
  teks: string,
  nilai: unknown[] = [],
): Promise<T | undefined> {
  const baris = await query<T>(teks, nilai);
  return baris[0];
}

/** Jalankan perintah dan kembalikan jumlah baris yang terpengaruh. */
export async function jalankan(teks: string, nilai: unknown[] = []): Promise<number> {
  const hasil = await jalankanKueri(teks, nilai);
  return hasil.rowCount ?? 0;
}

/** Satu unit kerja atomik. Kueri di dalam callback memakai koneksi dan transaksi yang sama. */
export async function denganTransaksi<T>(
  kerja: () => Promise<T>,
  isolasi: "READ COMMITTED" | "REPEATABLE READ" = "READ COMMITTED",
): Promise<T> {
  const klien = await dapatkanKumpulan().connect();
  try {
    await klien.query(`BEGIN ISOLATION LEVEL ${isolasi}`);
    const hasil = await konteksTransaksi.run(klien, kerja);
    await klien.query("COMMIT");
    return hasil;
  } catch (kesalahan) {
    await klien.query("ROLLBACK");
    throw kesalahan;
  } finally {
    klien.release();
  }
}

/** Tutup pool saat proses berhenti. Dipakai oleh skrip pengujian bila diperlukan. */
export async function tutupKoneksi(): Promise<void> {
  if (kumpulan) {
    await kumpulan.end();
    kumpulan = null;
  }
}
