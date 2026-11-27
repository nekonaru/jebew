import type { Metadata } from "next";
import Link from "next/link";
import { query } from "@/lib/database.ts";

export const metadata: Metadata = {
  title: "Artikel | Mie Jebew Warung Kak Ikaa",
  description: "Cerita resep dan tips dari Warung Kak Ikaa.",
};
export const dynamic = "force-dynamic";

export default async function HalamanArtikel() {
  const daftar = await query<{ id: number; judul: string; dibuat_pada: string }>(
    "SELECT id, judul, dibuat_pada FROM artikel WHERE aktif = TRUE ORDER BY dibuat_pada DESC LIMIT 20",
  );
  return (
    <main id="konten-utama" className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-utama hover:underline">Kembali ke menu</Link>
      <h1 className="mt-5 font-judul text-3xl font-semibold">Artikel dan resep</h1>
      <ul className="mt-6 space-y-3">
        {daftar.map((a) => (
          <li key={a.id} className="rounded-kartu border border-garis bg-permukaan p-5">
            <Link href={`/artikel/${a.id}`} className="font-judul text-lg font-semibold text-utama hover:underline">
              {a.judul}
            </Link>
            <p className="mt-1 text-xs text-tinta-lemah">{String(a.dibuat_pada).slice(0, 10)}</p>
          </li>
        ))}
        {daftar.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada artikel.</li>}
      </ul>
    </main>
  );
}
