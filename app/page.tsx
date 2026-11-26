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
