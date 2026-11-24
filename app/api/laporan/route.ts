import { NextResponse } from "next/server";
import { z } from "zod";
import { galat } from "@/lib/api-final.ts";
import { ambilLaporan, keCsv } from "@/lib/final/laporan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

const skema = z.object({
  dari: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sampai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict().refine((v) => v.dari <= v.sampai, { message: "Tanggal awal harus sebelum tanggal akhir" });

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const p = new URL(req.url).searchParams;
    const hari = tanggalHariIni();
    const rentang = skema.parse({ dari: p.get("dari") ?? hari, sampai: p.get("sampai") ?? hari });
    const laporan = await ambilLaporan(rentang.dari, rentang.sampai);
    if (p.get("format") === "csv") {
      return new Response(keCsv(laporan), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="laporan-${rentang.dari}-${rentang.sampai}.csv"`,
        },
      });
    }
    return NextResponse.json(laporan);
  } catch (e) { return galat(e) as NextResponse; }
}
