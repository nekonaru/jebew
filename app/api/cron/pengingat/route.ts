import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";
import { catatNotifikasi } from "@/lib/final/tambahan.ts";
import { kirimWhatsApp, pesanPengingat } from "@/lib/notifikasi.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Pengingat ambil untuk pesanan besok. Dipanggil Cron dengan bearer token. */
export async function POST(req: Request) {
  try {
    const rahasia = (process.env.CRON_RAHASIA ?? "").trim();
    if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
      return NextResponse.json({ pesan: "Tidak diizinkan" }, { status: 403 });
    }
    const daftar = await query<{
      id: number; kode: string; whatsapp: string; waktu_ambil: string;
    }>(
      `SELECT id, kode, whatsapp, waktu_ambil FROM preorder
       WHERE status IN ('baru', 'diproses', 'siap')
         AND CAST(LEFT(waktu_ambil, 10) AS DATE) =
             ((now() AT TIME ZONE 'Asia/Jakarta') + INTERVAL '1 day')::date
       LIMIT 200`,
    );
    let terkirim = 0;
    for (const p of daftar) {
      const pesan = pesanPengingat(p.kode, p.waktu_ambil);
      await catatNotifikasi(p.id, p.whatsapp, pesan);
      const hasil = await kirimWhatsApp(p.whatsapp, pesan);
      if (hasil.terkirim) terkirim += 1;
    }
    return NextResponse.json({ berhasil: true, diproses: daftar.length, terkirim });
  } catch (e) { return galat(e) as NextResponse; }
}
