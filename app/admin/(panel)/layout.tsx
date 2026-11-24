import { redirect } from "next/navigation";
import PanelAdmin from "@/komponen/PanelAdmin.tsx";
import { sudahMasuk } from "@/lib/akses.ts";
import { ambilPengaturan } from "@/lib/operasi.ts";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  if (!(await sudahMasuk())) redirect("/admin/login");
  const pengaturan = await ambilPengaturan();

  return <PanelAdmin namaUsaha={pengaturan.nama_usaha}>{children}</PanelAdmin>;
}
