import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { simpanPengaturan } from "@/lib/final/pengaturan.ts";

export const runtime = "nodejs";

const skema = z.object({
  kunci: z.enum(["toko_aktif", "preorder_aktif"]),
  nilai: z.enum(["true", "false"]),
}).strict();

/** Toggle cepat untuk status buka toko dan pre-order. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await simpanPengaturan({ [badan.kunci]: badan.nilai }, pengguna?.id);
    revalidateTag("status-final");
    return NextResponse.json({ berhasil: true, kunci: badan.kunci, nilai: badan.nilai });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
