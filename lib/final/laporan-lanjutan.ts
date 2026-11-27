// Analisis keuangan dan pelanggan lanjutan. Semua agregasi terjadi di database.

import { jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";

type Baris = Record<string, unknown>;

/** Pemasukan, pengeluaran, dan saldo berjalan per tanggal. */
export async function arusKas(dari: string, sampai: string): Promise<Baris[]> {
  const baris = await query<{ tanggal: string; pemasukan: number; pengeluaran: number }>(
    `WITH harian AS (
       SELECT CAST(dibuat_pada AS DATE) AS tanggal,
              SUM(total - diskon) AS pemasukan, 0 AS pengeluaran
       FROM penjualan
       WHERE CAST(dibuat_pada AS DATE) BETWEEN $1 AND $2
       GROUP BY 1
       UNION ALL
       SELECT tanggal, 0, SUM(jumlah)
       FROM pengeluaran
       WHERE tanggal BETWEEN $1 AND $2
       GROUP BY 1
     )
     SELECT tanggal, SUM(pemasukan) AS pemasukan, SUM(pengeluaran) AS pengeluaran
     FROM harian GROUP BY tanggal ORDER BY tanggal`,
    [dari, sampai],
  );
  let saldo = 0;
  return baris.map((b) => {
    saldo += Number(b.pemasukan) - Number(b.pengeluaran);
    return {
      tanggal: String(b.tanggal).slice(0, 10),
      pemasukan: Number(b.pemasukan), pengeluaran: Number(b.pengeluaran), saldo,
    };
  });
}

/** Anggaran bulanan dengan realisasi pengeluaran. */
export async function ambilAnggaran(bulan: string): Promise<Baris[]> {
  return query(
    `SELECT a.id, a.kategori, a.bulan, a.jumlah,
            COALESCE((SELECT SUM(p.jumlah) FROM pengeluaran p
                      JOIN kategori_pengeluaran k ON k.id = p.kategori_id
                      WHERE k.nama = a.kategori
                        AND TO_CHAR(p.tanggal, 'YYYY-MM') = a.bulan), 0) AS realisasi
     FROM anggaran a WHERE a.bulan = $1 ORDER BY a.kategori`,
    [bulan],
  );
}

export async function simpanAnggaran(kategori: string, bulan: string, jumlah: number): Promise<void> {
  await jalankan(
    `INSERT INTO anggaran (kategori, bulan, jumlah) VALUES ($1,$2,$3)
     ON CONFLICT (kategori, bulan) DO UPDATE SET jumlah = EXCLUDED.jumlah`,
    [kategori.trim().slice(0, 100), bulan, jumlah],
  );
}

/** Tagihan supplier yang sudah diterima tetapi belum lunas. */
export async function hutangSupplier(): Promise<Baris[]> {
  return query(
    `SELECT p.id, p.nomor, p.tanggal, p.total, s.nama AS supplier
     FROM purchase_order p LEFT JOIN supplier s ON s.id = p.supplier_id
     WHERE p.lunas = FALSE AND p.status = 'diterima'
     ORDER BY p.tanggal, p.id LIMIT 100`,
  );
}

export async function lunasiSupplier(id: number): Promise<void> {
  const hasil = await jalankan(
    "UPDATE purchase_order SET lunas = TRUE WHERE id = $1 AND lunas = FALSE", [id],
  );
  if (hasil === 0) throw new GalatBisnis("Tagihan sudah lunas atau tidak ditemukan");
}

/** Segmentasi pelanggan berdasarkan kedatangan, frekuensi, dan nilai belanja. */
export async function rfmPelanggan(): Promise<Baris[]> {
  const baris = await query<{
    whatsapp: string; terakhir: string; frekuensi: number; omzet: number;
  }>(
    `SELECT p.whatsapp, MAX(p.dibuat_pada) AS terakhir,
            COUNT(*)::int AS frekuensi, COALESCE(SUM(j.total - j.diskon), 0) AS omzet
     FROM preorder p JOIN penjualan j ON j.preorder_id = p.id
     WHERE p.status = 'selesai'
     GROUP BY p.whatsapp ORDER BY omzet DESC LIMIT 200`,
  );
  const hariIni = Date.now();
  return baris.map((b) => {
    const hari = Math.floor((hariIni - new Date(String(b.terakhir).replace(" ", "T") + "+07:00").getTime()) / 86400000);
    const segmen = b.frekuensi >= 5 && hari <= 30 ? "Loyal"
      : hari <= 30 ? "Aktif" : hari <= 90 ? "Perlu diingatkan" : "Berisiko pergi";
    return {
      whatsapp: b.whatsapp, terakhir: String(b.terakhir).slice(0, 10),
      frekuensi: Number(b.frekuensi), omzet: Number(b.omzet), hari, segmen,
    };
  });
}

/** Persentase pelanggan yang kembali dalam 30 hari. */
export async function retensiPelanggan(): Promise<{ total: number; kembali: number; persen: number }> {
  const baris = await querySatu<{ total: number; kembali: number }>(
    `WITH pelanggan AS (
       SELECT whatsapp, MIN(dibuat_pada) AS pertama, MAX(dibuat_pada) AS terakhir
       FROM preorder WHERE status = 'selesai' GROUP BY whatsapp
     )
     SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE terakhir > pertama + INTERVAL '1 day')::int AS kembali
     FROM pelanggan`,
  );
  const total = Number(baris?.total ?? 0);
  const kembali = Number(baris?.kembali ?? 0);
  return { total, kembali, persen: total > 0 ? Math.round(kembali / total * 100) : 0 };
}
