import { NextResponse } from "next/server";
import { ambilStatusPublik } from "@/lib/operasi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Data publik untuk halaman konsumen. Tidak mengandung data privat admin. */
export async function GET() {
  const status = await ambilStatusPublik();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
  });
}
