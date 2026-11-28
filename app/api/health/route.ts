import { NextResponse } from "next/server";
import { querySatu } from "@/lib/database.ts";
import { versiAplikasi } from "@/lib/versi.ts";

export const runtime = "nodejs";

/** Pemeriksaan kesiapan aplikasi, database, dan variabel wajib. */
export async function GET() {
  try {
    await querySatu("SELECT 1 AS siap");
    const [preorder, stok, notifikasi] = await Promise.all([
      querySatu<{ jumlah: number }>("SELECT COUNT(*)::int AS jumlah FROM preorder WHERE status IN ('baru','diproses','siap')"),
      querySatu<{ jumlah: number }>("SELECT COUNT(*)::int AS jumlah FROM bahan WHERE aktif = TRUE AND stok <= stok_minimum"),
      querySatu<{ jumlah: number }>("SELECT COUNT(*)::int AS jumlah FROM notifikasi WHERE status = 'tertunda'"),
    ]);
    return NextResponse.json({
      siap: true,
      versi: versiAplikasi(),
      waktu: new Date().toISOString(),
      database: process.env.DATABASE_URL ? "terkonfigurasi" : "belum diatur",
      sesi: process.env.RAHASIA_SESI ? "terkonfigurasi" : "belum diatur",
      statistik: {
        preorderAktif: Number(preorder?.jumlah ?? 0),
        bahanMenipis: Number(stok?.jumlah ?? 0),
        notifikasiTertunda: Number(notifikasi?.jumlah ?? 0),
      },
    });
  } catch {
    return NextResponse.json({ siap: false, pesan: "Database tidak merespons" }, { status: 503 });
  }
}
