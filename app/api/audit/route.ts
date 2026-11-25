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
    const daftar = await ambilAudit({
      aksi: (p.get("aksi") ?? "").slice(0, 20),
      tabel: (p.get("tabel") ?? "").slice(0, 40),
      cari: (p.get("cari") ?? "").trim().slice(0, 60),
      batas: p.get("format") === "csv" ? 5000 : 200,
    });
    if (p.get("format") === "csv") {
      const escape = (teks: string) => {
        const aman = /^[=+\-@\t\r]/.test(teks) ? `'${teks}` : teks;
        return `"${aman.replace(/"/g, '""')}"`;
      };
      const baris = ["Waktu,Aksi,Data,Catatan,Pengguna"];
      for (const a of daftar) {
        baris.push([
          `${a.dibuat_pada} WIB`, a.aksi, a.tabel,
          escape(a.catatan ?? ""), escape(a.nama_pengguna ?? "Sistem"),
        ].join(","));
      }
      return new Response("\uFEFF" + baris.join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"jebew-aktivitas.csv\"",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ audit: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}
