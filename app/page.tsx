import HalamanUtama from "@/komponen/HalamanUtama.tsx";
import { ambilMenuPublik, ambilPengaturan } from "@/lib/operasi.ts";

export const dynamic = "force-dynamic";

/** Menu diambil di server agar halaman pertama tampil tanpa menunggu fetch klien. */
export default async function HalamanAwal() {
  const [menu, pengaturan] = await Promise.all([
    ambilMenuPublik(),
    ambilPengaturan(),
  ]);

  return (
    <HalamanUtama
      menuAwal={menu}
      namaUsahaAwal={pengaturan.nama_usaha}
    />
  );
}
