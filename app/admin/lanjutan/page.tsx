import HalamanLanjutan from "@/komponen/final/HalamanLanjutan.tsx";
import { wajibPemilikHalaman } from "@/lib/halaman-pemilik.ts";

export default async function HalamanAdminLanjutan() {
  await wajibPemilikHalaman();
  return <HalamanLanjutan />;
}
