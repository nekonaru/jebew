import { NextResponse } from "next/server";
import { ambilMenuPublik, ambilPengaturan } from "@/lib/operasi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Data publik untuk halaman konsumen. Tidak mengandung data privat admin. */
export async function GET() {
  const pengaturan = ambilPengaturan();
  return NextResponse.json(
    {
      menu: ambilMenuPublik(),
      nama_usaha: pengaturan.nama_usaha,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
