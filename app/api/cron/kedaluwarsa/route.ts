import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { catatNotifikasi } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Notifikasi batch bahan yang kedaluwarsa dalam tiga hari. */
export async function POST(req: Request) {
  try {
    const rahasia = (process.env.CRON_RAHASIA ?? "").trim();
    if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
      return NextResponse.json({ pesan: "Tidak diizinkan" }, { status: 403 });
    }
    const batch = await query<{ nama: string; nomor_batch: string; tanggal_kedaluwarsa: string; sisa: number }>(
      `SELECT b.nama, k.nomor_batch, k.tanggal_kedaluwarsa, k.sisa
       FROM batch_bahan k JOIN bahan b ON b.id = k.bahan_id
       WHERE k.sisa > 0 AND k.tanggal_kedaluwarsa IS NOT NULL
         AND k.tanggal_kedaluwarsa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
       ORDER BY k.tanggal_kedaluwarsa LIMIT 50`,
    );
    if (batch.length === 0) return NextResponse.json({ berhasil: true, dibuat: 0 });
    const pengaturan = await ambilPengaturan();
    const tujuan = (process.env.WHATSAPP_ADMIN ?? "").trim() || (pengaturan.whatsapp_admin ?? "").trim();
    for (const b of batch) {
      const pesan = `Peringatan: batch ${b.nomor_batch} dari ${b.nama} kedaluwarsa ${String(b.tanggal_kedaluwarsa).slice(0, 10)}. Sisa ${b.sisa}.`;
      await catatNotifikasi(null, tujuan, pesan);
    }
    return NextResponse.json({ berhasil: true, dibuat: batch.length });
  } catch (e) { return galat(e) as NextResponse; }
}
