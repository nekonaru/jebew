import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
  hari_buka: z.string().trim().regex(
    /^(?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)(?: - (?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu))?$/,
    "Format hari: Senin - Minggu",
  ),
  jam_buka: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  jam_tutup: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  toko_aktif: z.enum(["true", "false"]),
  preorder_aktif: z.enum(["true", "false"]),
  preorder_jam_buka: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  preorder_jam_tutup: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
}).strict();

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanPengaturan(skema.parse(await req.json()), pengguna?.id);
    revalidateTag("status-final");
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
