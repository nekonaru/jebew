import { NextResponse } from "next/server";
import { querySatu } from "@/lib/database.ts";
import { versiAplikasi } from "@/lib/versi.ts";

export const runtime = "nodejs";

/** Pemeriksaan sederhana untuk pemantauan dan smoke test. */
export async function GET() {
  try {
    await querySatu("SELECT 1 AS siap");
    return NextResponse.json({
      siap: true,
      versi: versiAplikasi(),
      waktu: new Date().toISOString(),
      database: process.env.DATABASE_URL ? "terkonfigurasi" : "belum diatur",
      sesi: process.env.RAHASIA_SESI ? "terkonfigurasi" : "belum diatur",
    });
  } catch {
    return NextResponse.json({ siap: false, pesan: "Database tidak merespons" }, { status: 503 });
  }
}
