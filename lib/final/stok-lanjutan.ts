// Analisis stok lanjutan, riwayat harga supplier, dan purchase order.

import { jalankan, query, querySatu, denganTransaksi } from "../database.ts";
import { GalatBisnis } from "./galat.ts";

type Baris = Record<string, unknown>;

/** Bahan dengan perkiraan hari sebelum habis berdasarkan pemakaian tujuh hari. */
export async function prediksiStok(): Promise<Baris[]> {
  const baris = await query<{
    id: number; nama: string; satuan: string; stok: number;
    stok_minimum: number; pemakaian: number;
  }>(
    `SELECT b.id, b.nama, b.satuan, b.stok, b.stok_minimum,
            COALESCE(SUM(CASE WHEN ps.jenis = 'keluar' THEN ps.jumlah ELSE 0 END), 0) / 7.0 AS pemakaian
     FROM bahan b
     LEFT JOIN pergerakan_stok ps ON ps.bahan_id = b.id
       AND ps.dibuat_pada >= (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '7 days'
     WHERE b.aktif = TRUE
     GROUP BY b.id, b.nama, b.satuan, b.stok, b.stok_minimum
     ORDER BY b.stok ASC`,
  );
  return baris.map((b) => {
    const pemakaian = Number(b.pemakaian ?? 0);
    const sisaHari = pemakaian > 0 ? Math.floor(Number(b.stok) / pemakaian) : null;
    return {
      id: b.id, nama: b.nama, satuan: b.satuan,
      stok: Number(b.stok), stok_minimum: Number(b.stok_minimum),
      pemakaian: Math.round(pemakaian * 100) / 100,
      sisa_hari: sisaHari,
      status: Number(b.stok) <= Number(b.stok_minimum) ? "menipis"
        : sisaHari !== null && sisaHari <= 3 ? "segera" : "aman",
    };
  });
}

/** Daftar batch bahan dengan sisa dan kedaluwarsa. */
export async function ambilBatch(): Promise<Baris[]> {
  return query(
    `SELECT b.id, b.bahan_id, ba.nama AS bahan, b.nomor_batch, b.tanggal_masuk,
            b.tanggal_kedaluwarsa, b.jumlah, b.sisa, b.harga_satuan
     FROM batch_bahan b JOIN bahan ba ON ba.id = b.bahan_id
     WHERE b.sisa > 0
     ORDER BY CASE WHEN b.tanggal_kedaluwarsa IS NULL THEN 1 ELSE 0 END,
              b.tanggal_kedaluwarsa ASC, b.id ASC
     LIMIT 200`,
  );
}

export async function simpanBatch(input: {
  bahan_id: number; nomor_batch: string; tanggal_masuk: string;
  tanggal_kedaluwarsa: string; jumlah: number; harga_satuan: number;
}): Promise<void> {
  await denganTransaksi(async () => {
    await jalankan(
      `INSERT INTO batch_bahan (bahan_id, nomor_batch, tanggal_masuk, tanggal_kedaluwarsa, jumlah, sisa, harga_satuan)
       VALUES ($1,$2,$3,$4,$5,$5,$6)
       ON CONFLICT (bahan_id, nomor_batch) DO UPDATE SET
         jumlah = batch_bahan.jumlah + EXCLUDED.jumlah,
         sisa = batch_bahan.sisa + EXCLUDED.sisa,
         harga_satuan = EXCLUDED.harga_satuan`,
      [input.bahan_id, input.nomor_batch.trim().toUpperCase(), input.tanggal_masuk,
        input.tanggal_kedaluwarsa || null, input.jumlah, input.harga_satuan],
    );
    await jalankan("UPDATE bahan SET stok = stok + $1 WHERE id = $2", [input.jumlah, input.bahan_id]);
  });
}

/** Riwayat harga bahan dari supplier. */
export async function ambilSupplierHarga(): Promise<Baris[]> {
  return query(
    `SELECT h.id, h.harga_satuan, h.tanggal, b.nama AS bahan, s.nama AS supplier
     FROM supplier_harga h
     JOIN bahan b ON b.id = h.bahan_id
     LEFT JOIN supplier s ON s.id = h.supplier_id
     ORDER BY h.tanggal DESC, h.id DESC LIMIT 200`,
  );
}

export async function simpanSupplierHarga(input: {
  supplier_id: number; bahan_id: number; harga_satuan: number; tanggal: string;
}): Promise<void> {
  await jalankan(
    `INSERT INTO supplier_harga (supplier_id, bahan_id, harga_satuan, tanggal)
     VALUES ($1,$2,$3,$4)`,
    [input.supplier_id, input.bahan_id, input.harga_satuan, input.tanggal],
  );
}

/** Daftar purchase order beserta item ringkas. */
export async function ambilPurchaseOrder(): Promise<Baris[]> {
  return query(
    `SELECT p.id, p.nomor, p.tanggal, p.total, p.status, p.catatan,
            s.nama AS supplier,
            COALESCE((SELECT COUNT(*) FROM item_purchase_order i WHERE i.purchase_order_id = p.id), 0) AS jumlah_item
     FROM purchase_order p LEFT JOIN supplier s ON s.id = p.supplier_id
     ORDER BY p.tanggal DESC, p.id DESC LIMIT 100`,
  );
}

function nomorPurchaseOrder(): string {
  return `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

/** Buat purchase order dari beberapa bahan sekaligus. */
export async function simpanPurchaseOrder(input: {
  supplier_id: number | null; tanggal: string; catatan: string;
  items: { bahan_id: number; jumlah: number; harga_satuan: number }[];
}, penggunaId?: number): Promise<string> {
  if (input.items.length === 0) throw new GalatBisnis("Minimal satu bahan");
  return denganTransaksi(async () => {
    const nomor = nomorPurchaseOrder();
    const total = input.items.reduce((n, i) => n + Math.round(i.jumlah * i.harga_satuan), 0);
    await jalankan(
      `INSERT INTO purchase_order (nomor, supplier_id, total, tanggal, catatan, pengguna_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [nomor, input.supplier_id, total, input.tanggal, input.catatan.slice(0, 300), penggunaId ?? null],
    );
    const baris = await querySatu<{ id: number }>("SELECT id FROM purchase_order WHERE nomor = $1", [nomor]);
    for (const item of input.items) {
      await jalankan(
        `INSERT INTO item_purchase_order (purchase_order_id, bahan_id, jumlah, harga_satuan, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [baris!.id, item.bahan_id, item.jumlah, item.harga_satuan,
          Math.round(item.jumlah * item.harga_satuan)],
      );
    }
    return nomor;
  });
}

/** Tandai purchase order diterima dan tambah stok serta riwayat harga. */
export async function terimaPurchaseOrder(id: number, penggunaId?: number): Promise<void> {
  await denganTransaksi(async () => {
    const po = await querySatu<{
      status: string; supplier_id: number | null; tanggal: string;
    }>("SELECT status, supplier_id, tanggal FROM purchase_order WHERE id = $1 FOR UPDATE", [id]);
    if (!po) throw new GalatBisnis("Purchase order tidak ditemukan");
    if (po.status === "diterima") throw new GalatBisnis("Purchase order sudah diterima");
    const items = await query<{
      bahan_id: number; jumlah: number; harga_satuan: number;
    }>("SELECT bahan_id, jumlah, harga_satuan FROM item_purchase_order WHERE purchase_order_id = $1", [id]);
    for (const item of items) {
      await jalankan("UPDATE bahan SET stok = stok + $1 WHERE id = $2", [Number(item.jumlah), item.bahan_id]);
      await jalankan(
        `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
         SELECT $1, 'masuk', $2, stok - $2, stok, (SELECT nomor FROM purchase_order WHERE id = $3), 'Purchase order diterima', $4
         FROM bahan WHERE id = $1`,
        [item.bahan_id, Number(item.jumlah), id, penggunaId ?? null],
      );
      if (po.supplier_id) {
        await jalankan(
          `INSERT INTO supplier_harga (supplier_id, bahan_id, harga_satuan, tanggal)
           VALUES ($1,$2,$3,$4)`,
          [po.supplier_id, item.bahan_id, Number(item.harga_satuan), po.tanggal],
        );
      }
    }
    await jalankan("UPDATE purchase_order SET status = 'diterima' WHERE id = $1", [id]);
  });
}
