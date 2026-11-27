import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";

export const runtime = "nodejs";

/** Promo aktif untuk ditampilkan publik. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const promo = await query<{
      kode: string; jenis: string; nilai: number; minimum_belanja: number; berlaku_sampai: string;
    }>(
      `SELECT kode, jenis, nilai, minimum_belanja, berlaku_sampai FROM promo
       WHERE aktif = TRUE AND berlaku_dari <= CURRENT_DATE AND berlaku_sampai >= CURRENT_DATE
         AND TO_CHAR((now() AT TIME ZONE 'Asia/Jakarta'), 'HH24:MI') >= jam_mulai
         AND TO_CHAR((now() AT TIME ZONE 'Asia/Jakarta'), 'HH24:MI') < jam_selesai
       ORDER BY berlaku_sampai LIMIT 20`,
    );
    return NextResponse.json({ promo });
  } catch (e) { return galat(e) as NextResponse; }
}
