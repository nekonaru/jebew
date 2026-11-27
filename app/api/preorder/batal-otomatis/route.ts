import { NextResponse } from "next/server";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
import { query, querySatu } from "@/lib/database.ts";
import { ubahStatusPreorder } from "@/lib/final/transaksi.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Batalkan preorder aktif yang sudah lewat waktu ambil. Dijalankan pemilik atau Cron. */
export async function POST(req: Request) {
  try {
    const rahasia = (process.env.CRON_RAHASIA ?? "").trim();
    const panggilanCron = rahasia !== "" && req.headers.get("authorization") === `Bearer ${rahasia}`;
    let pengguna = null;
    if (!panggilanCron) {
      const hasil = await aman(req, "pemilik");
      if (hasil.penolakan) return hasil.penolakan;
      pengguna = hasil.pengguna;
      if (!(await izinLaju(`batal-otomatis:${pengguna?.id ?? "pemilik"}`, 10, 60 * 1000))) {
        return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
      }
    }
    const pengaturan = await querySatu<{ nilai: string }>(
      "SELECT nilai FROM pengaturan WHERE kunci = 'batal_batas_menit'",
    );
    const batas = Number(new URL(req.url).searchParams.get("menit")
      ?? pengaturan?.nilai ?? 120);
    const menit = Number.isFinite(batas) && batas >= 0 ? Math.min(10080, batas) : 120;
    const lewat = await query<{ id: number }>(
      `SELECT id FROM preorder
       WHERE status IN ('baru', 'diproses', 'siap')
         AND (waktu_ambil || ':00')::timestamp < ((now() AT TIME ZONE 'Asia/Jakarta') - ($1 || ' minutes')::interval)`,
      [menit],
    );
    let dibatalkan = 0;
    for (const baris of lewat) {
      try {
        await ubahStatusPreorder(baris.id, "batal", pengguna);
        dibatalkan += 1;
      } catch { /* pesanan berubah saat proses, lewati */ }
    }
    return NextResponse.json({ berhasil: true, dibatalkan });
  } catch (e) { return galat(e) as NextResponse; }
}
