import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
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
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    if (!(await izinLaju(`ekspor:${pengguna?.id ?? "pemilik"}`, 10, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak unduhan. Coba lagi sebentar." }, { status: 429 });
    }

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
      const dipotong: string[] = [];
      for (const nama of tabel) {
        const baris = await query(`SELECT * FROM ${nama} LIMIT 10001`);
        if (baris.length > 10000) dipotong.push(nama);
        hasil[nama] = baris.slice(0, 10000);
      }
      // Kata sandi pengguna sengaja tidak ikut dicadangkan.
      hasil.pengguna = await query(
        "SELECT id, nama, email, peran, aktif, dibuat_pada FROM pengguna ORDER BY id",
      );
      return { data: hasil, dipotong };
    }, "REPEATABLE READ");

    const isi = JSON.stringify({
      aplikasi: "Jebew",
      versi: versiAplikasi(),
      diekspor_pada: new Date().toISOString(),
      zona_waktu: "Asia/Jakarta",
      dipotong: data.dipotong,
      data: data.data,
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
