import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { galat } from "@/lib/api-final.ts";
import { querySatu } from "@/lib/database.ts";
import { ambilMenu } from "@/lib/final/menu.ts";
import { ambilBahan } from "@/lib/final/stok.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

const dataPublik = unstable_cache(
  async () => {
    const [menu, bahan, pengaturan] = await Promise.all([ambilMenu(), ambilBahan(), ambilPengaturan()]);
    return {
      menu: menu.filter((m) => m.aktif).map((m) => ({
        id: m.id, nama: m.nama, harga: m.harga, deskripsi: m.deskripsi, kategori: m.kategori,
        foto: m.foto, porsi: m.porsi, tersedia: m.tersedia,
        varian: m.varian.filter((v) => v.aktif).map((v) => ({ id: v.id, nama: v.nama, harga_tambahan: v.harga_tambahan })),
      })),
      pengaturan,
      bahanTipis: bahan.filter((b) => b.menipis).length,
    };
  },
  ["status-final"],
  { revalidate: 10 },
);

export async function GET() {
  try {
    const [publik, penjualan, pengeluaran, preorder] = await Promise.all([
      dataPublik(),
      querySatu<{ omzet: number; jumlah: number }>(
        "SELECT COALESCE(SUM(total),0) AS omzet, COUNT(*) AS jumlah FROM penjualan WHERE dibuat_pada::date = $1::date",
        [tanggalHariIni()],
      ),
      querySatu<{ jumlah: number }>(
        "SELECT COALESCE(SUM(jumlah),0) AS jumlah FROM pengeluaran WHERE tanggal::date = $1::date",
        [tanggalHariIni()],
      ),
      querySatu<{ jumlah: number }>(
        "SELECT COUNT(*) AS jumlah FROM preorder WHERE status IN ('baru','diproses')",
      ),
    ]);
    return NextResponse.json({
      ...publik,
      statistik: {
        omzet: Number(penjualan?.omzet ?? 0),
        transaksi: Number(penjualan?.jumlah ?? 0),
        pengeluaran: Number(pengeluaran?.jumlah ?? 0),
        preorderAktif: Number(preorder?.jumlah ?? 0),
      },
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
