import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { denganTransaksi, jalankan, query, querySatu } from "@/lib/database.ts";
import { catatAudit } from "@/lib/audit.ts";

export const runtime = "nodejs";

const skema = z.object({
  nama: z.string().trim().min(1).max(100),
  kontak: z.string().trim().max(100),
  aktif: z.boolean(),
}).strict();

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json({
      supplier: await query("SELECT id, nama, kontak, aktif FROM supplier ORDER BY nama"),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await req.json());
    const id = await denganTransaksi(async () => {
      const baris = await querySatu<{ id: number }>(
        "INSERT INTO supplier (nama, kontak, aktif) VALUES ($1,$2,$3) RETURNING id",
        [badan.nama, badan.kontak, badan.aktif],
      );
      await catatAudit(pengguna, "tambah", "supplier", badan.nama);
      return baris!.id;
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), ...skema.shape }).strict().parse(await req.json());
    const ada = await querySatu("SELECT id FROM supplier WHERE id = $1", [badan.id]);
    if (!ada) return NextResponse.json({ pesan: "Supplier tidak ditemukan" }, { status: 404 });
    await denganTransaksi(async () => {
      await jalankan(
        "UPDATE supplier SET nama=$1, kontak=$2, aktif=$3 WHERE id=$4",
        [badan.nama, badan.kontak, badan.aktif, badan.id],
      );
      await catatAudit(pengguna, "ubah", "supplier", `${badan.id} menjadi ${badan.nama}`);
    });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
    if (!id) return NextResponse.json({ pesan: "Id tidak valid" }, { status: 400 });
    // Data lama tetap dipertahankan lewat penonaktifan agar riwayat pembelian utuh.
    await denganTransaksi(async () => {
      await jalankan("UPDATE supplier SET aktif = FALSE WHERE id = $1", [id]);
      await catatAudit(pengguna, "hapus", "supplier", String(id));
    });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
