import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { querySatu } from "@/lib/database.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

/** Ringkasan keuangan hari ini. Hanya untuk pengguna yang sudah masuk. */
export async function GET() {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const [penjualan, pengeluaran, preorder, bahan, menu] = await Promise.all([
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
      querySatu<{ jumlah: number }>(
        "SELECT COUNT(*) AS jumlah FROM bahan WHERE aktif = TRUE AND stok <= stok_minimum",
      ),
      querySatu<{ total: number }>(
        "SELECT COUNT(*) AS total FROM menu WHERE aktif = TRUE",
      ),
    ]);
    return NextResponse.json({
      omzet: Number(penjualan?.omzet ?? 0),
      transaksi: Number(penjualan?.jumlah ?? 0),
      pengeluaran: Number(pengeluaran?.jumlah ?? 0),
      preorderAktif: Number(preorder?.jumlah ?? 0),
      bahanTipis: Number(bahan?.jumlah ?? 0),
      menuTotal: Number(menu?.total ?? 0),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
