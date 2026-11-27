import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pesan dari meja | Mie Jebew Warung Kak Ikaa",
  description: "Pesan mie hangat langsung dari meja Anda.",
};

export default async function HalamanMeja({ params }: { params: Promise<{ nomor: string }> }) {
  const { nomor } = await params;
  const meja = decodeURIComponent(nomor).slice(0, 20);
  return (
    <main id="konten-utama" className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-utama">Warung Kak Ikaa</p>
      <h1 className="mt-3 font-judul text-3xl font-semibold">Meja {meja}</h1>
      <p className="mt-2 text-sm text-tinta-lemah">Pilih menu, lalu nomor meja akan terisi otomatis saat pengisian data.</p>
      <Link href={`/?meja=${encodeURIComponent(meja)}`}
        className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-utama px-6 text-sm font-semibold text-white">
        Lihat menu
      </Link>
    </main>
  );
}
