import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { hapusSlotWaktu } from "@/lib/final/pengaturan.ts";

export const runtime = "nodejs";

/** Hapus slot kosong. Slot yang sudah dipakai pesanan aktif tidak boleh dihapus. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const { id: teksId } = await params;
    const id = Number(teksId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ pesan: "Id slot tidak valid" }, { status: 400 });
    }
    const berhasil = await hapusSlotWaktu(id, pengguna?.id);
    if (!berhasil) {
      return NextResponse.json({ pesan: "Slot sudah dipakai pesanan aktif dan tidak bisa dihapus." }, { status: 409 });
    }
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
