import HalamanPengaturan from "@/komponen/final/HalamanPengaturan.tsx";
import { wajibPemilikHalaman } from "@/lib/halaman-pemilik.ts";

export default async function Page() {
  await wajibPemilikHalaman();
  return <HalamanPengaturan />;
}
