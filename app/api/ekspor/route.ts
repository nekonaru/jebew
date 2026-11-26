import { readFileSync } from "node:fs";
import path from "node:path";
import { aman, galat } from "@/lib/api-final.ts";
import { denganTransaksi, query } from "@/lib/database.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

function versiAplikasi(): string {
  try {
    const isi = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { version: string };
    return isi.version;
  } catch {
    return "tidak diketahui";
  }
}

/** Cadangan seluruh data usaha untuk pemilik. Kata sandi sengaja tidak disertakan. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;

    const tabel = [
      "pengaturan", "supplier", "konversi_satuan", "bahan", "pergerakan_stok",
      "pembelian", "item_pembelian", "stok_opname", "item_opname",
      "menu", "resep", "varian", "item_varian",
      "slot_waktu", "preorder", "item_preorder",
      "penjualan", "item_penjualan",
      "kategori_pengeluaran", "pengeluaran", "tutup_kasir", "log_audit",
    ];
    // Satu transaksi menghasilkan snapshot konsisten. Kueri dijalankan berurutan
    // karena transaksi memakai satu koneksi.
    const data = await denganTransaksi(async () => {
      const hasil: Record<string, unknown> = {};
      for (const nama of tabel) hasil[nama] = await query(`SELECT * FROM ${nama}`);
      // Kata sandi pengguna sengaja tidak ikut dicadangkan.
      hasil.pengguna = await query(
        "SELECT id, nama, email, peran, aktif, dibuat_pada FROM pengguna ORDER BY id",
      );
      return hasil;
    }, "REPEATABLE READ");

    const isi = JSON.stringify({
      aplikasi: "Jebew",
      versi: versiAplikasi(),
      diekspor_pada: new Date().toISOString(),
      zona_waktu: "Asia/Jakarta",
      data,
    });

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
