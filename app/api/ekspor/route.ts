import { aman, galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

/** Cadangan seluruh data usaha untuk pemilik. Kata sandi sengaja tidak disertakan. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;

    const [
      pengaturan, pengguna, bahan, supplier, menu, pembelian, opname,
      preorder, penjualan, pengeluaran, kategori, slot, audit,
    ] = await Promise.all([
      query("SELECT * FROM pengaturan"),
      query("SELECT id, nama, email, peran, aktif, dibuat_pada FROM pengguna ORDER BY id"),
      query("SELECT * FROM bahan ORDER BY nama"),
      query("SELECT * FROM supplier ORDER BY nama"),
      query("SELECT * FROM menu ORDER BY kategori, nama"),
      query("SELECT * FROM pembelian ORDER BY id DESC"),
      query("SELECT * FROM stok_opname ORDER BY id DESC"),
      query("SELECT * FROM preorder ORDER BY id DESC"),
      query("SELECT * FROM penjualan ORDER BY id DESC"),
      query("SELECT * FROM pengeluaran ORDER BY id DESC"),
      query("SELECT * FROM kategori_pengeluaran ORDER BY nama"),
      query("SELECT * FROM slot_waktu ORDER BY tanggal, jam"),
      query("SELECT * FROM log_audit ORDER BY id DESC LIMIT 500"),
    ]);

    const isi = JSON.stringify({
      aplikasi: "Jebew",
      versi: "1.2.0",
      diekspor_pada: new Date().toISOString(),
      zona_waktu: "Asia/Jakarta",
      data: {
        pengaturan, pengguna, bahan, supplier, menu, pembelian, opname,
        preorder, penjualan, pengeluaran, kategori, slot, audit,
      },
    }, null, 2);

    return new Response(isi, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="jebew-cadangan-${tanggalHariIni()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (kesalahan) {
    return galat(kesalahan) as Response;
  }
}
