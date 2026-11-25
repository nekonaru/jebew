import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { jalankan, query, denganTransaksi } from "@/lib/database.ts";
import { catatAudit } from "@/lib/audit.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABEL = [
  "pengaturan", "supplier", "konversi_satuan", "bahan", "pergerakan_stok",
  "pembelian", "item_pembelian", "stok_opname", "item_opname",
  "menu", "resep", "varian", "item_varian",
  "slot_waktu", "preorder", "item_preorder",
  "penjualan", "item_penjualan",
  "kategori_pengeluaran", "pengeluaran", "tutup_kasir", "log_audit",
];

// Urutan mengikuti kunci asing. Pengguna dan pembatasan laju sengaja tidak dipulihkan.
const HAPUS = [
  "item_penjualan", "item_preorder", "item_pembelian", "item_opname", "item_varian",
  "log_audit", "tutup_kasir", "pengeluaran", "pergerakan_stok",
  "penjualan", "preorder", "pembelian", "stok_opname", "resep", "varian",
  "menu", "bahan", "slot_waktu", "supplier", "konversi_satuan",
  "kategori_pengeluaran", "pengaturan",
];

const KOLOM_PENGGUNA = ["kasir_id", "pengguna_id"];
const UKURAN_BATCH = 200;

const skema = z.object({
  aplikasi: z.literal("Jebew"),
  versi: z.string().max(20).optional(),
  konfirmasi: z.literal("PULIHKAN"),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
}).strict();

/** Pulihkan data dari berkas cadangan. Hanya pemilik dan hanya dengan konfirmasi eksplisit. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik", 4 * 1024 * 1024);
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
      if (baris.length > 30000) {
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

      const daftarPengguna = await query<{ id: number }>("SELECT id FROM pengguna");
      const idPengguna = new Set(daftarPengguna.map((p) => Number(p.id)));

      for (const tabel of HAPUS) {
        await jalankan(`DELETE FROM ${tabel}`);
      }

      for (const [tabel, baris] of Object.entries(dataCadangan)) {
        const diizinkan = petaKolom.get(tabel)!;
        const kunci = [...new Set(baris.flatMap((b) => Object.keys(b)))].filter((k) => diizinkan.has(k));
        if (kunci.length === 0) continue;
        const namaKolom = kunci.map((k) => `"${k}"`).join(",");

        let buffer: unknown[][] = [];
        const tulis = async () => {
          if (buffer.length === 0) return;
          let penanda = 1;
          const nilai: unknown[] = [];
          const barisSql = buffer.map((b) => {
            const bagian = b.map((n) => `$${penanda++}`).join(",");
            nilai.push(...b);
            return `(${bagian})`;
          });
          await jalankan(`INSERT INTO ${tabel} (${namaKolom}) VALUES ${barisSql.join(",")}`, nilai);
          buffer = [];
        };

        for (const barisData of baris) {
          buffer.push(kunci.map((k) => {
            if (KOLOM_PENGGUNA.includes(k)) {
              const nilai = barisData[k];
              return nilai != null && idPengguna.has(Number(nilai)) ? nilai : null;
            }
            return barisData[k] ?? null;
          }));
          if (buffer.length >= UKURAN_BATCH) await tulis();
        }
        await tulis();
      }

      for (const tabel of TABEL) {
        if (!petaKolom.get(tabel)!.has("id")) continue;
        await jalankan(
          `SELECT setval(pg_get_serial_sequence($1, 'id'),
             COALESCE((SELECT MAX(id) FROM ${tabel}), 1),
             (SELECT MAX(id) FROM ${tabel}) IS NOT NULL)`,
          [tabel],
        );
      }
      await catatAudit(pengguna, "tambah", "pulihkan", `${Object.keys(dataCadangan).length} tabel dipulihkan`);
      return Object.values(dataCadangan).reduce((n, b) => n + b.length, 0);
    });

    return NextResponse.json({ berhasil: true, jumlahBaris: hasil });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
