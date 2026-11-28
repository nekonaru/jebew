import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, query } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  id: z.number().int().positive().optional(),
  nama: z.string().trim().min(1).max(100),
  alamat: z.string().trim().max(300),
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
    const daftar = await query(`SELECT id, nama, alamat, aktif FROM lokasi ${syarat} ORDER BY nama`);
    return NextResponse.json({ lokasi: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.id) {
      await jalankan(
        "UPDATE lokasi SET nama=$1, alamat=$2, aktif=$3 WHERE id=$4",
        [badan.nama, badan.alamat, badan.aktif, badan.id],
      );
    } else {
      await jalankan(
        "INSERT INTO lokasi (nama, alamat, aktif) VALUES ($1,$2,$3)",
        [badan.nama, badan.alamat, badan.aktif],
      );
    }
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
