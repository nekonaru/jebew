import { NextResponse } from "next/server";
import { ambilMenuPublik, ambilPengaturan } from "@/lib/operasi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Data publik untuk halaman konsumen. Tidak mengandung data privat admin. */
export async function GET() {
  const pengaturan = await ambilPengaturan();
  return NextResponse.json(
    {
      menu: await ambilMenuPublik(),
      nama_usaha: pengaturan.nama_usaha,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
