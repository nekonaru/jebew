import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = Number(new URL(req.url).searchParams.get("menu") ?? 0);
    const baris = id > 0
      ? await query(
        `SELECT r.id, r.menu_id, m.nama AS menu, r.aksi, r.rincian, r.dibuat_pada
         FROM resep_log r JOIN menu m ON m.id = r.menu_id
         WHERE r.menu_id = $1 ORDER BY r.dibuat_pada DESC LIMIT 100`, [id],
      )
      : await query(
        `SELECT r.id, r.menu_id, m.nama AS menu, r.aksi, r.rincian, r.dibuat_pada
         FROM resep_log r JOIN menu m ON m.id = r.menu_id
         ORDER BY r.dibuat_pada DESC LIMIT 100`,
      );
    return NextResponse.json({ riwayat: baris });
  } catch (e) { return galat(e) as NextResponse; }
}
