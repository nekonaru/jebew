import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { galat } from "@/lib/api-final.ts";
import { lacakPreorder } from "@/lib/final/transaksi.ts";

export const runtime = "nodejs";

/** Webhook WhatsApp untuk balasan status lewat kode lacak. */
export async function POST(req: Request) {
  try {
    const rahasia = (process.env.WHATSAPP_WEBHOOK_SECRET ?? "").trim();
    const tanda = req.headers.get("x-jebew-signature") ?? "";
    const isi = await req.text();
    if (rahasia) {
      const hitung = createHmac("sha256", rahasia).update(isi).digest("hex");
      const a = Buffer.from(hitung);
      const b = Buffer.from(tanda);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json({ pesan: "Tanda tangan tidak valid" }, { status: 403 });
      }
    }
    const badan = JSON.parse(isi) as {
      entry?: { changes?: { value?: { messages?: { text?: { body?: string }; from?: string }[] } }[] }[];
    };
    const pesan = badan.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const teks = pesan?.text?.body?.trim() ?? "";
    if (!teks) return NextResponse.json({ berhasil: true, dijawab: false });
    const kodeMatch = teks.match(/[A-F0-9]{8}/i);
    if (!kodeMatch) {
      return NextResponse.json({
        berhasil: true, dijawab: true,
        balasan: "Kirim kode lacak 8 karakter, contoh A1B2C3D4, untuk mengecek status pesanan.",
      });
    }
    const hasil = await lacakPreorder(kodeMatch[0].toUpperCase());
    const balasan = hasil
      ? `Pesanan ${hasil.kode}: ${hasil.status}. Waktu ambil ${hasil.waktu_ambil} WIB. Total ${hasil.total}.`
      : "Kode lacak tidak ditemukan. Periksa kembali kode Anda.";
    return NextResponse.json({ berhasil: true, dijawab: true, balasan });
  } catch (e) { return galat(e) as NextResponse; }
}
