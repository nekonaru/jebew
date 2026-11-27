import type { Metadata } from "next";
import Link from "next/link";
import { querySatu } from "@/lib/database.ts";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artikel = await querySatu<{ judul: string }>(
    "SELECT judul FROM artikel WHERE id = $1 AND aktif = TRUE", [Number(id)],
  );
  return artikel
    ? { title: `${artikel.judul} | Mie Jebew`, description: artikel.judul }
    : { title: "Artikel tidak ditemukan | Mie Jebew" };
}

export default async function HalamanArtikelDetail({ params }: Props) {
  const { id } = await params;
  const artikel = await querySatu<{ judul: string; isi: string; dibuat_pada: string }>(
    "SELECT judul, isi, dibuat_pada FROM artikel WHERE id = $1 AND aktif = TRUE", [Number(id)],
  );
  if (!artikel) {
    return (
      <main id="konten-utama" className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-judul text-2xl font-semibold">Artikel tidak ditemukan</h1>
        <Link href="/artikel" className="mt-4 inline-block font-semibold text-utama hover:underline">Kembali ke artikel</Link>
      </main>
    );
  }
  return (
    <main id="konten-utama" className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/artikel" className="text-sm font-semibold text-utama hover:underline">Kembali ke artikel</Link>
      <p className="mt-6 text-xs text-tinta-lemah">{String(artikel.dibuat_pada).slice(0, 10)}</p>
      <h1 className="mt-2 font-judul text-3xl font-semibold">{artikel.judul}</h1>
      <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-tinta">{artikel.isi}</p>
    </main>
  );
}
