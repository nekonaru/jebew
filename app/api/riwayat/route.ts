import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { query, querySatu } from "@/lib/database.ts";
import { tanggalHariIni, tanggalParameter } from "@/lib/format.ts";

export const runtime = "nodejs";

function mundur(hari: number): string {
  const t = new Date(`${tanggalHariIni()}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - hari);
  return t.toISOString().slice(0, 10);
}

/** Riwayat penjualan dengan pencarian, rentang tanggal, dan rincian per transaksi. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;

    const p = new URL(req.url).searchParams;
    const id = Number(p.get("id") ?? 0);

    if (id > 0) {
      const header = await querySatu<{
        id: number; nomor: string; total: number; diskon: number; metode: string;
        sumber: string; catatan: string; dibuat_pada: string;
      }>(
        `SELECT id, nomor, total, diskon, metode, sumber, catatan, dibuat_pada
         FROM penjualan WHERE id = $1`, [id],
      );
      if (!header) return NextResponse.json({ pesan: "Transaksi tidak ditemukan" }, { status: 404 });
      const items = await query<{
        nama_menu: string; nama_varian: string; harga_satuan: number; jumlah: number; subtotal: number;
      }>(
        `SELECT nama_menu, nama_varian, harga_satuan, jumlah, subtotal
         FROM item_penjualan WHERE penjualan_id = $1 ORDER BY id`, [id],
      );
      return NextResponse.json({ detail: { ...header, items } });
    }

    if (p.get("dari") === "" || p.get("sampai") === "") {
      return NextResponse.json({ pesan: "Format tanggal tidak valid" }, { status: 400 });
    }
    const dari = p.has("dari") ? tanggalParameter(p.get("dari"), "") : mundur(29);
    const sampai = p.has("sampai") ? tanggalParameter(p.get("sampai"), "") : tanggalHariIni();
    if (!dari || !sampai) {
      return NextResponse.json({ pesan: "Format tanggal tidak valid" }, { status: 400 });
    }
    if (dari > sampai) {
      return NextResponse.json({ pesan: "Tanggal awal tidak boleh setelah tanggal akhir" }, { status: 400 });
    }
    const cari = (p.get("cari") ?? "").trim().slice(0, 60);
    const csv = p.get("format") === "csv";
    const halaman = csv ? 1 : Math.max(1, Number(p.get("halaman") ?? 1) || 1);
    const per = csv ? 5000 : 12;
    const offset = (halaman - 1) * per;
    const syarat = `p.dibuat_pada::date BETWEEN $1::date AND $2::date
      AND ($3 = '' OR p.nomor ILIKE '%' || $3 || '%'
        OR EXISTS (SELECT 1 FROM item_penjualan i2
                   WHERE i2.penjualan_id = p.id AND i2.nama_menu ILIKE '%' || $3 || '%'))`;
    const nilai = [dari, sampai, cari];

    const [daftar, hitung] = await Promise.all([
      query<{
        id: number; nomor: string; total: number; metode: string; sumber: string;
        dibuat_pada: string; jumlah_item: number; porsi: number;
      }>(
        `SELECT p.id, p.nomor, p.total, p.metode, p.sumber, p.dibuat_pada,
                COUNT(i.id) AS jumlah_item, COALESCE(SUM(i.jumlah),0) AS porsi
         FROM penjualan p LEFT JOIN item_penjualan i ON i.penjualan_id = p.id
         WHERE ${syarat}
         GROUP BY p.id ORDER BY p.dibuat_pada DESC, p.id DESC
         LIMIT $4 OFFSET $5`,
        [...nilai, per, offset],
      ),
      querySatu<{ jumlah: number }>(
        `SELECT COUNT(*) AS jumlah FROM penjualan p WHERE ${syarat}`, nilai,
      ),
    ]);

    const total = Number(hitung?.jumlah ?? 0);
    if (csv) {
      const baris = ["Nomor,Waktu,Sumber,Item,Porsi,Metode,Total"];
      if (total > daftar.length) {
        baris.push(`# Dipotong: menampilkan ${daftar.length} dari ${total} transaksi. Persempit rentang tanggal.`);
      }
      for (const d of daftar) {
        baris.push([
          d.nomor,
          `${d.dibuat_pada} WIB`,
          d.sumber,
          d.jumlah_item,
          d.porsi,
          d.metode,
          d.total,
        ].join(","));
      }
      return new Response(baris.join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="riwayat-${dari}-${sampai}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({
      daftar,
      total,
      halaman,
      jumlahHalaman: Math.max(1, Math.ceil(total / per)),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
