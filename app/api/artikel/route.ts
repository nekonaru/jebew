import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, query } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  id: z.number().int().positive().optional(),
  judul: z.string().trim().min(1).max(150),
  isi: z.string().trim().min(1).max(10000),
  aktif: z.boolean(),
}).strict();

export async function GET(req: Request) {
  try {
    const publik = new URL(req.url).searchParams.get("publik") === "true";
    if (!publik) {
      const { penolakan } = await aman(req, "pemilik");
      if (penolakan) return penolakan;
    }
    const syarat = publik ? "WHERE aktif = TRUE" : "";
    const daftar = await query(
      `SELECT id, judul, isi, aktif, dibuat_pada FROM artikel ${syarat} ORDER BY dibuat_pada DESC LIMIT 50`,
    );
    return NextResponse.json({ artikel: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.id) {
      await jalankan(
        "UPDATE artikel SET judul=$1, isi=$2, aktif=$3 WHERE id=$4",
        [badan.judul, badan.isi, badan.aktif, badan.id],
      );
    } else {
      await jalankan(
        "INSERT INTO artikel (judul, isi, aktif) VALUES ($1,$2,$3)",
        [badan.judul, badan.isi, badan.aktif],
      );
    }
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
