import type { Metadata } from "next";
import Link from "next/link";
import { formatRupiah } from "@/lib/format.ts";
import { ambilMenuPublik } from "@/lib/final/menu.ts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const menu = (await ambilMenuPublik()).find((m) => m.id === Number(id));
  if (!menu) return { title: "Menu tidak ditemukan | Jebew" };
  return {
    title: `${menu.nama} | Mie Jebew Warung Kak Ikaa`,
    description: menu.deskripsi || `Pesan ${menu.nama} dari Warung Kak Ikaa.`,
    openGraph: { title: menu.nama, description: menu.deskripsi, type: "website" },
  };
}

export default async function HalamanMenuDetail({ params }: Props) {
  const { id } = await params;
  const menu = (await ambilMenuPublik()).find((m) => m.id === Number(id));
  if (!menu) {
    return (
      <main id="konten-utama" className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-judul text-2xl font-semibold">Menu tidak ditemukan</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-utama hover:underline">Kembali ke menu</Link>
      </main>
    );
  }
  return (
    <main id="konten-utama" className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-utama hover:underline">Kembali ke menu</Link>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-utama">{menu.kategori}</p>
      <h1 className="mt-2 font-judul text-3xl font-semibold">{menu.nama}</h1>
      <p className="mt-3 text-sm leading-relaxed text-tinta-lemah">{menu.deskripsi}</p>
      <p className="mt-5 font-judul text-2xl font-semibold text-utama">{formatRupiah(menu.harga)}</p>
      <p className="mt-2 text-xs text-tinta-lemah">
        {menu.tersedia ? `Tersedia sekitar ${menu.porsi} porsi` : "Sedang habis"}
      </p>
      {menu.varian.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm">
          {menu.varian.map((v) => (
            <li key={v.id} className="flex justify-between rounded-xl border border-garis bg-permukaan px-4 py-2">
              <span>{v.nama}</span>
              <span className="font-semibold">+ {formatRupiah(v.harga_tambahan)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/#menu" className="mt-7 inline-flex min-h-[46px] items-center rounded-xl bg-utama px-5 text-sm font-semibold text-white">
        Pesan sekarang
      </Link>
    </main>
  );
}
