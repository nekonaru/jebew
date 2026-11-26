import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilTutupKasir, tutupKasir } from "@/lib/final/laporan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { tanggalHariIni, tanggalValid } from "@/lib/format.ts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pengguna = await penggunaSaatIni();
    if (!pengguna) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    if (pengguna.peran !== "pemilik") {
      return NextResponse.json({ pesan: "Hanya pemilik yang bisa melihat tutup kasir" }, { status: 403 });
    }
    return NextResponse.json({ daftar: await ambilTutupKasir() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  tanggal: z.string().refine(tanggalValid, "Tanggal tidak valid")
    .refine((v) => v <= tanggalHariIni(), "Tanggal tidak boleh di masa depan"),
  kas_fisik: z.number().int().min(0).max(100000000),
  catatan: z.string().trim().max(200),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await tutupKasir(skema.parse(await bacaJsonTerbatasi(req)), pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
