// Pengirim notifikasi WhatsApp. Memakai WhatsApp Business API bila kredensial tersedia.
// Tanpa kredensial, fungsi mengembalikan tautan wa.me agar admin tetap bisa mengirim.

import { nomorWhatsApp, tautanWhatsApp } from "./wa.ts";

export type HasilKirim = { terkirim: boolean; tautan: string; keterangan: string };

/** Kirim pesan ke nomor pelanggan. Fallback selalu tersedia. */
export async function kirimWhatsApp(tujuan: string, pesan: string): Promise<HasilKirim> {
  const nomor = nomorWhatsApp(tujuan);
  const tautan = nomor ? tautanWhatsApp(nomor, pesan) : "";
  const token = (process.env.WHATSAPP_API_TOKEN ?? "").trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID ?? "").trim();
  if (!token || !phoneId || !nomor) {
    return { terkirim: false, tautan, keterangan: "Tautan WhatsApp siap dipakai" };
  }
  try {
    const respons = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: nomor,
        type: "text",
        text: { body: pesan.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (respons.ok) return { terkirim: true, tautan, keterangan: "Pesan terkirim" };
    return { terkirim: false, tautan, keterangan: "API menolak, pakai tautan WhatsApp" };
  } catch {
    return { terkirim: false, tautan, keterangan: "API tidak tersedia, pakai tautan WhatsApp" };
  }
}

/** Pesan status pesanan untuk pelanggan. */
export function pesanStatus(kode: string, kodeLacak: string, status: string, waktuAmbil: string): string {
  const teks = status === "siap"
    ? "sudah siap diambil"
    : status === "diproses"
      ? "sedang kami siapkan"
      : "sedang kami terima";
  return `Halo, pesanan ${kode} ${teks}. Waktu ambil ${waktuAmbil} WIB. Kode lacak ${kodeLacak}. Terima kasih.`;
}

/** Pesan pengingat ambil pesanan. */
export function pesanPengingat(kode: string, waktuAmbil: string): string {
  return `Pengingat: pesanan ${kode} siap diambil ${waktuAmbil} WIB. Tunjukkan kode pesanan saat pengambilan.`;
}
