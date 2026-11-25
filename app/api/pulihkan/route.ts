import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { jalankan, query, denganTransaksi } from "@/lib/database.ts";
import { catatAudit } from "@/lib/audit.ts";

export const runtime = "nodejs";

const TABEL = [
  "pengaturan", "supplier", "konversi_satuan", "bahan", "pergerakan_stok",
  "pembelian", "item_pembelian", "stok_opname", "item_opname",
  "menu", "resep", "varian", "item_varian",
  "slot_waktu", "preorder", "item_preorder",
  "penjualan", "item_penjualan",
  "kategori_pengeluaran", "pengeluaran", "tutup_kasir", "log_audit",
];

// Urutan mengikuti kunci asing. Pengguna sengaja tidak dipulihkan agar akun tetap aman.
const HAPUS = [
  "item_penjualan", "item_preorder", "item_pembelian", "item_opname", "item_varian",
  "log_audit", "tutup_kasir", "pengeluaran", "pergerakan_stok",
  "penjualan", "preorder", "pembelian", "stok_opname", "resep", "varian",
  "menu", "bahan", "slot_waktu", "supplier", "konversi_satuan",
  "kategori_pengeluaran", "pengaturan",
];

const skema = z.object({
  aplikasi: z.literal("Jebew"),
  versi: z.string().max(20).optional(),
  konfirmasi: z.literal("PULIHKAN"),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
}).strict();

/** Pulihkan data dari berkas cadangan. Hanya pemilik dan hanya dengan konfirmasi eksplisit. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik", 8 * 1024 * 1024);
    if (penolakan) return penolakan;
    const badan = skema.parse(await req.json());
    // Akun dan pembatasan laju sengaja tidak dipulihkan dari cadangan.
    const { pengguna: _pengguna, pembatasan_laju: _laju, ...dataCadangan } = badan.data;

    for (const tabel of TABEL) {
      if (!(tabel in dataCadangan)) {
        return NextResponse.json({ pesan: `Berkas cadangan tidak lengkap, tabel ${tabel} tidak ada` }, { status: 400 });
      }
    }
    for (const [nama, baris] of Object.entries(dataCadangan)) {
      if (!TABEL.includes(nama)) {
        return NextResponse.json({ pesan: `Tabel ${nama} tidak dikenal` }, { status: 400 });
      }
      if (baris.length > 5000) {
        return NextResponse.json({ pesan: `Jumlah baris ${nama} terlalu banyak` }, { status: 400 });
      }
    }

    const petaKolom = new Map<string, Set<string>>();
    const hasil = await denganTransaksi(async () => {
      for (const tabel of TABEL) {
        const kolom = await query<{ column_name: string }>(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [tabel],
        );
        petaKolom.set(tabel, new Set(kolom.map((k) => k.column_name)));
      }

      for (const tabel of HAPUS) {
        await jalankan(`DELETE FROM ${tabel}`);
      }

      for (const [tabel, baris] of Object.entries(dataCadangan)) {
        const diizinkan = petaKolom.get(tabel)!;
        for (const barisData of baris) {
          const kunci = Object.keys(barisData).filter((k) => diizinkan.has(k));
          if (kunci.length === 0) continue;
          const namaKolom = kunci.map((k) => `"${k}"`).join(",");
          const penanda = kunci.map((_, i) => `$${i + 1}`).join(",");
          await jalankan(
            `INSERT INTO ${tabel} (${namaKolom}) VALUES (${penanda})`,
            kunci.map((k) => ["kasir_id", "pengguna_id"].includes(k) ? null : barisData[k] ?? null),
          );
        }
      }

      await catatAudit(pengguna, "tambah", "pulihkan", `${Object.keys(dataCadangan).length} tabel dipulihkan`);
      return Object.values(dataCadangan).reduce((n, baris) => n + baris.length, 0);
    });

    // Sequence diselaraskan setelah transaksi berhasil, agar kegagalan tidak mengubahnya.
    for (const tabel of TABEL) {
      if (!petaKolom.get(tabel)!.has("id")) continue;
      await jalankan(
        `SELECT setval(pg_get_serial_sequence($1, 'id'),
           COALESCE((SELECT MAX(id) FROM ${tabel}), 1),
           (SELECT MAX(id) FROM ${tabel}) IS NOT NULL)`,
        [tabel],
      );
    }

    return NextResponse.json({ berhasil: true, jumlahBaris: hasil });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
