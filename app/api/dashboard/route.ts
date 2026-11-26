import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { galat } from "@/lib/api-final.ts";
import { ambilMenuPublik } from "@/lib/final/menu.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { pengaturanPublik } from "@/lib/publik.ts";
import { statusPreorder, statusToko } from "@/lib/jadwal.ts";
import { ambilHariLibur, ambilJadwalHarian } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

/** Coba ulang sekali bila koneksi database sempat terputus. */
async function denganCobaUlang<T>(kerja: () => Promise<T>, sisa = 1): Promise<T> {
  try {
    return await kerja();
  } catch (kesalahan) {
    const teks = kesalahan instanceof Error ? kesalahan.message : String(kesalahan);
    if (sisa > 0 && /connection|timeout|terminated/i.test(teks)) {
      return denganCobaUlang(kerja, sisa - 1);
    }
    throw kesalahan;
  }
}

/** Data publik untuk website konsumen. Tidak memuat statistik keuangan. */
const dataPublik = unstable_cache(
  async () => {
    const [menu, pengaturan] = await denganCobaUlang(() => Promise.all([
      ambilMenuPublik(), ambilPengaturan(),
    ]));
    return {
      menu,
      pengaturan: pengaturanPublik(pengaturan),
    };
  },
  ["status-final"],
  { revalidate: 5, tags: ["status-final"] },
);

export async function GET() {
  try {
    const data = await dataPublik();
    const [jadwal, libur] = await Promise.all([ambilJadwalHarian(), ambilHariLibur()]);
    const jadwalHari = jadwal.map((j) => ({
      jenis: String(j.jenis), hari: Number(j.hari),
      jam_buka: String(j.jam_buka), jam_tutup: String(j.jam_tutup), aktif: Boolean(j.aktif),
    }));
    const tanggalLibur = libur.map((l) => String(l.tanggal).slice(0, 10));
    // Status dihitung setiap permintaan agar perubahan pemilik langsung terlihat.
    const pengaturan = {
      ...data.pengaturan,
      status_toko: statusToko(data.pengaturan, new Date(), jadwalHari, tanggalLibur),
      status_preorder: statusPreorder(data.pengaturan, new Date(), jadwalHari, tanggalLibur),
    };
    return NextResponse.json({ menu: data.menu, pengaturan }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
