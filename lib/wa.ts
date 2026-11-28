// Penyusun pesan WhatsApp untuk pre-order.

import { formatRupiah } from "./format.ts";

export type BarangPesanan = {
  namaMenu: string;
  hargaSatuan: number;
  jumlah: number;
};

export type RincianPreorder = {
  kode: string;
  namaPelanggan: string;
  whatsapp: string;
  waktuAmbil: string;
  catatan: string;
  items: BarangPesanan[];
  namaUsaha: string;
  totalAkhir?: number;
  tipe?: string;
  metode?: string;
  ongkir?: number;
  buktiBayar?: string;
  zona?: string;
  pajak?: number;
  lokasi?: string;
};

/** Menyusun pesan teks rapi yang siap dikirim lewat wa.me. */
export function susunPesanWhatsApp(rincian: RincianPreorder): string {
  const total = rincian.items.reduce(
    (nilai, item) => nilai + item.hargaSatuan * item.jumlah,
    0,
  );

  const barisItems = rincian.items.map((item, indeks) => {
    const subtotal = item.hargaSatuan * item.jumlah;
    return `${indeks + 1}. ${item.namaMenu} x${item.jumlah} = ${formatRupiah(subtotal)}`;
  });

  const bagian: string[] = [
    `Halo ${rincian.namaUsaha}, saya ingin pre-order.`,
    "",
    `Kode pesanan: ${rincian.kode}`,
    `Nama: ${rincian.namaPelanggan}`,
    `WhatsApp: ${rincian.whatsapp}`,
    `Waktu ambil: ${rincian.waktuAmbil}`,
    ...(rincian.lokasi ? [`Lokasi ambil: ${rincian.lokasi}`] : []),
    `Jenis: ${rincian.tipe === "dine_in" ? "Makan di tempat" : rincian.tipe === "kirim" ? "Dikirim" : "Ambil di warung"}`,
    `Metode bayar: ${rincian.metode ?? "tunai"}`,
    "",
    "Rincian pesanan:",
    ...barisItems,
    "",
    `Subtotal: ${formatRupiah(total)}`,
    ...(rincian.zona ? [`Zona kirim: ${rincian.zona}`] : []),
    ...(rincian.ongkir ? [`Ongkir: ${formatRupiah(rincian.ongkir)}`] : []),
    ...(rincian.pajak ? [`PPN: ${formatRupiah(rincian.pajak)}`] : []),
    `Total bayar: ${formatRupiah(rincian.totalAkhir ?? total)}`,
  ];

  if (rincian.catatan.trim() !== "") {
    bagian.push("", `Catatan: ${rincian.catatan.trim()}`);
  }
  if (rincian.buktiBayar?.trim()) {
    bagian.push(`Bukti bayar: ${rincian.buktiBayar.trim()}`);
  }

  bagian.push("", "Mohon dikonfirmasi. Terima kasih.");
  return bagian.join("\n");
}

/** Ubah nomor lokal menjadi format internasional wa.me tanpa tanda plus. */
export function nomorWhatsApp(nomor: string): string {
  const angka = nomor.replace(/[^\d]/g, "");
  if (!angka) return "";
  if (angka.startsWith("0")) return `62${angka.slice(1)}`;
  if (angka.startsWith("8")) return `62${angka}`;
  return angka;
}

/** Membuat tautan wa.me dari nomor lokal maupun internasional. */
export function tautanWhatsApp(nomorAdmin: string, pesan: string): string {
  const nomorBersih = nomorWhatsApp(nomorAdmin);
  if (!nomorBersih) return "";
  return `https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`;
}
