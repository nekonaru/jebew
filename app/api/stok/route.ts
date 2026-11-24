import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { ambilPergerakan, restockBahan } from "@/lib/final/stok.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const bahanId = Number(new URL(req.url).searchParams.get("bahan") ?? 0) || undefined;
    return NextResponse.json({ pergerakan: await ambilPergerakan(bahanId) });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(), tambahan: z.number().finite().positive(),
      catatan: z.string().trim().max(200).default(""),
    }).strict().parse(await req.json());
    await restockBahan(badan.id, badan.tambahan, pengguna, badan.catatan);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
