import { redirect } from "next/navigation";
import FormulirLogin from "@/komponen/FormulirLogin.tsx";
import { sudahMasuk } from "@/lib/akses.ts";

export const dynamic = "force-dynamic";

export default async function HalamanLogin() {
  if (await sudahMasuk()) redirect("/admin");
  return <FormulirLogin />;
}
