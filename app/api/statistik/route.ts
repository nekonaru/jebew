import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { query, querySatu } from "@/lib/database.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

/** Ringkasan keuangan hari ini. Hanya untuk pengguna yang sudah masuk. */
export async function GET() {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const [penjualan, pengeluaran, preorder, bahan, menu, tren, menipis, terlaris] = await Promise.all([
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
      query<{ tanggal: string; omzet: number; transaksi: number }>(
        `SELECT d.hari::date AS tanggal,
                COALESCE(SUM(p.total),0) AS omzet,
                COUNT(p.id) AS transaksi
         FROM generate_series($1::date - INTERVAL '6 days', $1::date, INTERVAL '1 day') AS d(hari)
         LEFT JOIN penjualan p ON p.dibuat_pada::date = d.hari::date
         GROUP BY d.hari::date ORDER BY d.hari::date`,
        [tanggalHariIni()],
      ),
      query<{ id: number; nama: string; satuan: string; stok: number; stok_minimum: number }>(
        `SELECT id, nama, satuan, stok, stok_minimum FROM bahan
         WHERE aktif = TRUE AND stok <= stok_minimum ORDER BY stok ASC LIMIT 6`,
      ),
      query<{ nama: string; varian: string; jumlah: number; omzet: number }>(
        `SELECT i.nama_menu AS nama, i.nama_varian AS varian,
                SUM(i.jumlah) AS jumlah, SUM(i.subtotal) AS omzet
         FROM item_penjualan i JOIN penjualan p ON p.id = i.penjualan_id
         WHERE p.dibuat_pada::date BETWEEN ($1::date - INTERVAL '6 days') AND $1::date
         GROUP BY i.nama_menu, i.nama_varian ORDER BY jumlah DESC LIMIT 5`,
        [tanggalHariIni()],
      ),
    ]);
    return NextResponse.json({
      omzet: Number(penjualan?.omzet ?? 0),
      transaksi: Number(penjualan?.jumlah ?? 0),
      pengeluaran: Number(pengeluaran?.jumlah ?? 0),
      preorderAktif: Number(preorder?.jumlah ?? 0),
      bahanTipis: Number(bahan?.jumlah ?? 0),
      menuTotal: Number(menu?.total ?? 0),
      tren: tren.map((t) => ({
        tanggal: String(t.tanggal).slice(0, 10),
        omzet: Number(t.omzet),
        transaksi: Number(t.transaksi),
      })),
      bahanMenipis: menipis.map((b) => ({
        id: b.id, nama: b.nama, satuan: b.satuan,
        stok: Number(b.stok), stok_minimum: Number(b.stok_minimum),
      })),
      terlaris: terlaris.map((t) => ({
        nama: t.nama, varian: t.varian,
        jumlah: Number(t.jumlah), omzet: Number(t.omzet),
      })),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
