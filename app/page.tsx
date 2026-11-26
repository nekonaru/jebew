import HalamanKonsumen from "@/komponen/final/HalamanKonsumen.tsx";
import { ambilMenuPublik } from "@/lib/final/menu.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { dataPengunjung } from "@/lib/publik.ts";

export const dynamic = "force-dynamic";

export default async function HalamanAwal() {
  const [menu, pengaturan] = await Promise.all([ambilMenuPublik(), ambilPengaturan()]);
  return <HalamanKonsumen awal={{ menu, pengaturan: dataPengunjung(pengaturan) }} />;
}
