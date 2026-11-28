import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";
import { jalankan } from "@/lib/database.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABEL = [
  "pengaturan", "supplier", "konversi_satuan", "bahan", "pergerakan_stok",
  "pembelian", "item_pembelian", "stok_opname", "item_opname",
  "menu", "resep", "varian", "item_varian", "slot_waktu", "preorder",
  "item_preorder", "penjualan", "item_penjualan", "kategori_pengeluaran",
  "pengeluaran", "tutup_kasir", "log_audit", "lokasi", "zonakirim",
];

/** Cadangan otomatis ke tabel internal. Dipanggil Cron dengan bearer token. */
export async function POST(req: Request) {
  try {
    const rahasia = (process.env.CRON_RAHASIA ?? "").trim();
    if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
      return NextResponse.json({ pesan: "Tidak diizinkan" }, { status: 403 });
    }
    const isi: Record<string, unknown[]> = {};
    for (const nama of TABEL) {
      const tabel = nama === "zonakirim" ? "zona_kirim" : nama;
      try {
        isi[nama] = await query(`SELECT * FROM ${tabel} LIMIT 10000`);
      } catch { isi[nama] = []; }
    }
    const teks = JSON.stringify({ aplikasi: "Jebew", dibuat: new Date().toISOString(), data: isi });
    await jalankan(
      `INSERT INTO backup_terjadwal (jumlah_tabel, ukuran, isi) VALUES ($1,$2,$3)`,
      [Object.keys(isi).length, teks.length, teks],
    );
    return NextResponse.json({ berhasil: true, tabel: Object.keys(isi).length, ukuran: teks.length });
  } catch (e) { return galat(e) as NextResponse; }
}
