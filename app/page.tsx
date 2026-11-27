import HalamanKonsumen from "@/komponen/final/HalamanKonsumen.tsx";
import { ambilMenuPublik } from "@/lib/final/menu.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { dataPengunjung } from "@/lib/publik.ts";
import { ambilHariLibur, ambilJadwalHarian } from "@/lib/final/tambahan.ts";

export const dynamic = "force-dynamic";

export default async function HalamanAwal() {
  const [menu, pengaturan, jadwal, libur] = await Promise.all([
    ambilMenuPublik(), ambilPengaturan(), ambilJadwalHarian(), ambilHariLibur(),
  ]);
  if (pengaturan.pemeliharaan === "true") {
    return (
      <main id="konten-utama" className="flex min-h-screen items-center justify-center bg-latar px-4">
        <div className="w-full max-w-lg rounded-kartu border border-garis bg-permukaan p-8 text-center shadow-kartu">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={56} height={56} className="mx-auto" />
          <h1 className="mt-4 font-judul text-2xl font-semibold">Warung sedang disiapkan</h1>
          <p className="mt-2 text-sm text-tinta-lemah">
            Kami sedang memperbarui layanan. Silakan kembali beberapa saat lagi. Terima kasih atas kesabarannya.
          </p>
        </div>
      </main>
    );
  }
  return <HalamanKonsumen awal={{
    menu,
    pengaturan: dataPengunjung(pengaturan,
      jadwal.map((j) => ({
        jenis: String(j.jenis), hari: Number(j.hari),
        jam_buka: String(j.jam_buka), jam_tutup: String(j.jam_tutup), aktif: Boolean(j.aktif),
      })),
      libur.map((l) => String(l.tanggal).slice(0, 10))),
  }} />;
}
