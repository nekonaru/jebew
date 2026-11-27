import { redirect } from "next/navigation";
import LayarDapur from "@/komponen/final/LayarDapur.tsx";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const dynamic = "force-dynamic";

export default async function Page() {
  const pengguna = await penggunaSaatIni();
  if (!pengguna || !["pemilik", "kasir", "dapur"].includes(pengguna.peran)) redirect("/login");
  return <LayarDapur />;
}
