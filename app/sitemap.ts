import type { MetadataRoute } from "next";
import { query } from "@/lib/database.ts";

/** Peta situs dinamis untuk halaman publik, menu, dan artikel. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dasar = (process.env.SITE_URL ?? "https://jebew-final.vercel.app").replace(/\/$/, "");
  const sekarang = new Date();
  const [menu, artikel] = await Promise.all([
    query<{ id: number }>("SELECT id FROM menu WHERE aktif = TRUE ORDER BY id"),
    query<{ id: number }>("SELECT id FROM artikel WHERE aktif = TRUE ORDER BY id"),
  ]).catch(() => [[], []] as [{ id: number }[], { id: number }[]]);
  return [
    { url: dasar, lastModified: sekarang, changeFrequency: "daily", priority: 1 },
    { url: `${dasar}/promo`, lastModified: sekarang, changeFrequency: "daily", priority: 0.6 },
    { url: `${dasar}/artikel`, lastModified: sekarang, changeFrequency: "weekly", priority: 0.5 },
    { url: `${dasar}/lacak`, lastModified: sekarang, changeFrequency: "monthly", priority: 0.5 },
    { url: `${dasar}/login`, lastModified: sekarang, changeFrequency: "monthly", priority: 0.2 },
    ...menu.map((m) => ({ url: `${dasar}/menu/${m.id}`, lastModified: sekarang, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...artikel.map((a) => ({ url: `${dasar}/artikel/${a.id}`, lastModified: sekarang, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
