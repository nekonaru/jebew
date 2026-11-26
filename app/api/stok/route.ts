import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilPergerakan, restockBahan } from "@/lib/final/stok.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const teksBahan = new URL(req.url).searchParams.get("bahan") ?? "";
    const bahanValid = /^\d+$/.test(teksBahan) && Number(teksBahan) >= 1 && Number(teksBahan) <= 2147483647;
    if (teksBahan && !bahanValid) {
      return NextResponse.json({ pesan: "Id bahan tidak valid" }, { status: 400 });
    }
    const bahanId = teksBahan ? Number(teksBahan) : undefined;
    return NextResponse.json({ pergerakan: await ambilPergerakan(bahanId) });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(), tambahan: z.number().finite().positive(),
      catatan: z.string().trim().max(200).default(""),
    }).strict().parse(await bacaJsonTerbatasi(req));
    await restockBahan(badan.id, badan.tambahan, pengguna, badan.catatan);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
