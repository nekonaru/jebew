import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { ambilPengaturan, simpanPengaturan } from "@/lib/final/pengaturan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json(await ambilPengaturan());
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  nama_usaha: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(150),
  whatsapp_admin: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/),
  hari_buka: z.string().trim().min(1).max(60),
  jam_buka: z.string().trim().regex(/^\d{2}:\d{2}$/),
  jam_tutup: z.string().trim().regex(/^\d{2}:\d{2}$/),
  toko_aktif: z.enum(["true", "false"]),
}).strict();

export async function PUT(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanPengaturan(skema.parse(await req.json()));
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
