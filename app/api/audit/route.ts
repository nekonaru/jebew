import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { ambilAudit } from "@/lib/final/pengaturan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const pengguna = await penggunaSaatIni();
    if (!pengguna) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    if (pengguna.peran !== "pemilik") {
      return NextResponse.json({ pesan: "Hanya pemilik yang bisa melihat audit" }, { status: 403 });
    }
    const p = new URL(req.url).searchParams;
    return NextResponse.json({
      audit: await ambilAudit({
        aksi: (p.get("aksi") ?? "").slice(0, 20),
        tabel: (p.get("tabel") ?? "").slice(0, 40),
        cari: (p.get("cari") ?? "").trim().slice(0, 60),
      }),
    });
  } catch (e) { return galat(e) as NextResponse; }
}
