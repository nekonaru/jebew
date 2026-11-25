import HalamanKeuangan from "@/komponen/final/HalamanKeuangan.tsx";
import { wajibPemilikHalaman } from "@/lib/halaman-pemilik.ts";

export default async function Page() {
  await wajibPemilikHalaman();
  return <HalamanKeuangan />;
}
