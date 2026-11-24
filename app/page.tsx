import HalamanUtama from "@/komponen/HalamanUtama.tsx";
import { ambilStatusPublik } from "@/lib/operasi.ts";

export const dynamic = "force-dynamic";

/** Menu diambil di server agar halaman pertama tampil tanpa menunggu fetch klien. */
export default async function HalamanAwal() {
  const status = await ambilStatusPublik();

  return (
    <HalamanUtama
      menuAwal={status.menu}
      namaUsahaAwal={status.nama_usaha}
    />
  );
}
