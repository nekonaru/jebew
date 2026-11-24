import { redirect } from "next/navigation";
import Panel from "@/komponen/final/Panel.tsx";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) redirect("/login");
  return <Panel nama={pengguna.nama} peran={pengguna.peran}>{children}</Panel>;
}
