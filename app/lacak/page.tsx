import HalamanLacak from "@/komponen/final/HalamanLacak.tsx";

export default async function Page({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  const parameter = await searchParams;
  return <HalamanLacak kodeAwal={parameter.kode ?? ""} />;
}
