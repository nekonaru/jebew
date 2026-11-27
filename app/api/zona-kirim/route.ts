import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, query } from "@/lib/database.ts";

export const runtime = "nodejs";

/** Zona kirim yang tersedia. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const zona = await query<{ id: number; nama: string; tarif: number; keterangan: string; aktif: boolean }>(
      "SELECT id, nama, tarif, keterangan, aktif FROM zona_kirim WHERE aktif = TRUE ORDER BY tarif, nama",
    );
    return NextResponse.json({ zona });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  id: z.number().int().positive().optional(),
  nama: z.string().trim().min(1).max(60),
  tarif: z.number().int().min(0).max(10000000),
  keterangan: z.string().trim().max(200),
  aktif: z.boolean(),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.id) {
      await jalankan(
        `UPDATE zona_kirim SET nama=$1, tarif=$2, keterangan=$3, aktif=$4 WHERE id=$5`,
        [badan.nama, badan.tarif, badan.keterangan, badan.aktif, badan.id],
      );
    } else {
      await jalankan(
        `INSERT INTO zona_kirim (nama, tarif, keterangan, aktif) VALUES ($1,$2,$3,$4)`,
        [badan.nama, badan.tarif, badan.keterangan, badan.aktif],
      );
    }
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
