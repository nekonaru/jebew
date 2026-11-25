import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { query, querySatu } from "@/lib/database.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

function hariLalu(): string {
  const t = new Date(`${tanggalHariIni()}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

/** Ringkasan untuk kasir. Data keuangan hanya dikirim ke pemilik. */
export async function GET() {
  try {
    const pengguna = await penggunaSaatIni();
    if (!pengguna) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }

    const [preorder, bahan, menu, menipis] = await Promise.all([
      querySatu<{ jumlah: number }>(
        "SELECT COUNT(*) AS jumlah FROM preorder WHERE status IN ('baru','diproses')",
      ),
      querySatu<{ jumlah: number }>(
        "SELECT COUNT(*) AS jumlah FROM bahan WHERE aktif = TRUE AND stok <= stok_minimum",
      ),
      querySatu<{ total: number }>(
        "SELECT COUNT(*) AS total FROM menu WHERE aktif = TRUE",
      ),
      query<{ id: number; nama: string; satuan: string; stok: number; stok_minimum: number }>(
        `SELECT id, nama, satuan, stok, stok_minimum FROM bahan
         WHERE aktif = TRUE AND stok <= stok_minimum ORDER BY stok ASC LIMIT 6`,
      ),
    ]);

    const dasar = {
      preorderAktif: Number(preorder?.jumlah ?? 0),
      bahanTipis: Number(bahan?.jumlah ?? 0),
      menuTotal: Number(menu?.total ?? 0),
      bahanMenipis: menipis.map((b) => ({
        id: b.id, nama: b.nama, satuan: b.satuan,
        stok: Number(b.stok), stok_minimum: Number(b.stok_minimum),
      })),
    };

    if (pengguna.peran !== "pemilik") return NextResponse.json(dasar);

    const [penjualan, pengeluaran, tren, terlaris, nilaiStok, kemarin] = await Promise.all([
      querySatu<{ omzet: number; jumlah: number }>(
        "SELECT COALESCE(SUM(total),0) AS omzet, COUNT(*) AS jumlah FROM penjualan WHERE dibuat_pada::date = $1::date",
        [tanggalHariIni()],
      ),
      querySatu<{ jumlah: number }>(
        "SELECT COALESCE(SUM(jumlah),0) AS jumlah FROM pengeluaran WHERE tanggal::date = $1::date",
        [tanggalHariIni()],
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
      query<{ nama: string; varian: string; jumlah: number; omzet: number }>(
        `WITH bobot AS (
           SELECT i.nama_menu, i.nama_varian, i.jumlah, i.subtotal,
                  COALESCE(
                    p.total::numeric / NULLIF(SUM(i.subtotal) OVER (PARTITION BY p.id), 0),
                    p.total::numeric
                  ) AS faktor
           FROM item_penjualan i JOIN penjualan p ON p.id = i.penjualan_id
           WHERE p.dibuat_pada::date BETWEEN ($1::date - INTERVAL '6 days') AND $1::date
         )
         SELECT nama_menu AS nama, nama_varian AS varian,
                SUM(jumlah) AS jumlah, SUM(subtotal * faktor) AS omzet
         FROM bobot GROUP BY nama_menu, nama_varian ORDER BY jumlah DESC LIMIT 5`,
        [tanggalHariIni()],
      ),
      querySatu<{ nilai: number }>(
        "SELECT COALESCE(SUM(stok * harga_rata_rata),0) AS nilai FROM bahan WHERE aktif = TRUE",
      ),
      querySatu<{ omzet: number; jumlah: number }>(
        "SELECT COALESCE(SUM(total),0) AS omzet, COUNT(*) AS jumlah FROM penjualan WHERE dibuat_pada::date = $1::date",
        [hariLalu()],
      ),
    ]);

    return NextResponse.json({
      ...dasar,
      omzet: Number(penjualan?.omzet ?? 0),
      transaksi: Number(penjualan?.jumlah ?? 0),
      omzetKemarin: Number(kemarin?.omzet ?? 0),
      transaksiKemarin: Number(kemarin?.jumlah ?? 0),
      pengeluaran: Number(pengeluaran?.jumlah ?? 0),
      nilaiStok: Number(nilaiStok?.nilai ?? 0),
      tren: tren.map((t) => ({
        tanggal: String(t.tanggal).slice(0, 10),
        omzet: Number(t.omzet),
        transaksi: Number(t.transaksi),
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
