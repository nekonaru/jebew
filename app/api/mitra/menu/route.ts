import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { ambilMenuPublik } from "@/lib/final/menu.ts";

export const runtime = "nodejs";

/** Daftar menu untuk mitra dengan API key. */
export async function GET(req: Request) {
  try {
    const kunci = (process.env.MITRA_API_KEY ?? "").trim();
    const diterima = req.headers.get("x-api-key") ?? "";
    if (!kunci || diterima !== kunci) {
      return NextResponse.json({ pesan: "API key tidak valid" }, { status: 401 });
    }
    const menu = await ambilMenuPublik();
    return NextResponse.json({ menu });
  } catch (e) { return galat(e) as NextResponse; }
}
