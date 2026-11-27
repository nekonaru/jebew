import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";

export const runtime = "nodejs";

/** Ulasan yang sudah disetujui untuk tampil di website konsumen. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const ulasan = await query<{ rating: number; komentar: string; dibuat_pada: string }>(
      `SELECT rating, komentar, foto, dibuat_pada FROM ulasan
       WHERE status = 'diterima' ORDER BY dibuat_pada DESC LIMIT 6`,
    );
    const rata = ulasan.length > 0
      ? Math.round((ulasan.reduce((n, u) => n + Number(u.rating), 0) / ulasan.length) * 10) / 10
      : 0;
    return NextResponse.json({ ulasan, rata, jumlah: ulasan.length });
  } catch (e) { return galat(e) as NextResponse; }
}
