import HalamanLaporan from "@/komponen/final/HalamanLaporan.tsx";
import { wajibPemilikHalaman } from "@/lib/halaman-pemilik.ts";

export default async function Page() {
  await wajibPemilikHalaman();
  return <HalamanLaporan />;
}
