import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { galat } from "@/lib/api-final.ts";
import { ambilMenuPublik } from "@/lib/final/menu.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { ambilBahan } from "@/lib/final/stok.ts";

export const runtime = "nodejs";

/** Data publik untuk website konsumen. Tidak memuat statistik keuangan. */
const dataPublik = unstable_cache(
  async () => {
    const [menu, pengaturan, bahan] = await Promise.all([
      ambilMenuPublik(), ambilPengaturan(), ambilBahan(),
    ]);
    return {
      menu,
      pengaturan: {
        nama_usaha: pengaturan.nama_usaha ?? "Warung Kak Ikaa",
        tagline: pengaturan.tagline ?? "Mie Jebew Chili Oil",
        whatsapp_admin: pengaturan.whatsapp_admin ?? process.env.WHATSAPP_ADMIN ?? "6282173282591",
        jam_buka: pengaturan.jam_buka ?? "10:00",
        jam_tutup: pengaturan.jam_tutup ?? "21:00",
        hari_buka: pengaturan.hari_buka ?? "Senin - Minggu",
        toko_aktif: pengaturan.toko_aktif ?? "true",
      },
    };
  },
  ["status-final"],
  { revalidate: 10 },
);

export async function GET() {
  try {
    return NextResponse.json(await dataPublik());
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
