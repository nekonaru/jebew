import { redirect } from "next/navigation";
import { penggunaSaatIni } from "./auth.ts";

/** Pengaman halaman sisi server, bukan sekadar menyembunyikan tautan navigasi. */
export async function wajibPemilikHalaman() {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) redirect("/login");
  if (pengguna.peran !== "pemilik") redirect("/admin");
  return pengguna;
}
