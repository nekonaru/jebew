import type { Metadata } from "next";
import Link from "next/link";
import { formatRupiah } from "@/lib/format.ts";
import { query } from "@/lib/database.ts";

export const metadata: Metadata = {
  title: "Promo | Mie Jebew Warung Kak Ikaa",
  description: "Daftar promo yang sedang aktif di Warung Kak Ikaa.",
};

export const dynamic = "force-dynamic";

export default async function HalamanPromoPublik() {
  const promo = await query<{
    kode: string; jenis: string; nilai: number; minimum_belanja: number; berlaku_sampai: string;
  }>(
    `SELECT kode, jenis, nilai, minimum_belanja, berlaku_sampai FROM promo
     WHERE aktif = TRUE AND berlaku_dari <= CURRENT_DATE AND berlaku_sampai >= CURRENT_DATE
     ORDER BY berlaku_sampai LIMIT 20`,
  );
  return (
    <main id="konten-utama" className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-utama hover:underline">Kembali ke menu</Link>
      <h1 className="mt-5 font-judul text-3xl font-semibold">Promo aktif</h1>
      <p className="mt-2 text-sm text-tinta-lemah">Masukkan kode di halaman pemesanan untuk memakai promo.</p>
      <ul className="mt-6 space-y-3">
        {promo.map((p) => (
          <li key={p.kode} className="rounded-kartu border border-garis bg-permukaan p-5 shadow-kartu">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-judul text-lg font-semibold text-utama">{p.kode}</p>
              <p className="text-sm font-semibold text-sukses">
                {p.jenis === "persen" ? `${p.nilai}%` : formatRupiah(p.nilai)}
              </p>
            </div>
            <p className="mt-2 text-xs text-tinta-lemah">
              Minimum belanja {formatRupiah(p.minimum_belanja)}. Berlaku sampai {String(p.berlaku_sampai).slice(0, 10)}.
            </p>
          </li>
        ))}
        {promo.length === 0 && (
          <li className="rounded-kartu border border-dashed border-garis bg-permukaan p-8 text-center text-sm text-tinta-lemah">
            Belum ada promo aktif. Cek kembali nanti.
          </li>
        )}
      </ul>
    </main>
  );
}
