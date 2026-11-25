import HalamanMaster from "@/komponen/final/HalamanMaster.tsx";
import { wajibPemilikHalaman } from "@/lib/halaman-pemilik.ts";

export default async function HalamanAdminMaster() {
  await wajibPemilikHalaman();
  return <HalamanMaster />;
}
