import { redirect } from "next/navigation";
import FormulirLogin from "@/komponen/final/FormulirLogin.tsx";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const dynamic = "force-dynamic";

export default async function HalamanLogin() {
  if (await penggunaSaatIni()) redirect("/admin");
  return <FormulirLogin />;
}
