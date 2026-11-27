import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, query } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  id: z.number().int().positive().optional(),
  nama: z.string().trim().min(1).max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/),
  menu_id: z.number().int().positive(),
  jumlah: z.number().int().positive().max(100),
  hari: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  jam: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  aktif: z.boolean(),
}).strict();

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const daftar = await query(
      `SELECT l.id, l.nama, l.whatsapp, l.jumlah, l.hari, l.jam, l.aktif, m.nama AS menu
       FROM langganan l JOIN menu m ON m.id = l.menu_id ORDER BY l.dibuat_pada DESC LIMIT 100`,
    );
    return NextResponse.json({ langganan: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.id) {
      await jalankan(
        `UPDATE langganan SET nama=$1, whatsapp=$2, menu_id=$3, jumlah=$4, hari=$5, jam=$6, aktif=$7 WHERE id=$8`,
        [badan.nama, badan.whatsapp, badan.menu_id, badan.jumlah, badan.hari,
          badan.jam, badan.aktif, badan.id],
      );
    } else {
      await jalankan(
        `INSERT INTO langganan (nama, whatsapp, menu_id, jumlah, hari, jam, aktif)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [badan.nama, badan.whatsapp, badan.menu_id, badan.jumlah, badan.hari, badan.jam, badan.aktif],
      );
    }
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
