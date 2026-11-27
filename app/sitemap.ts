import type { MetadataRoute } from "next";

/** Peta situs statis untuk halaman publik. */
export default function sitemap(): MetadataRoute.Sitemap {
  const dasar = (process.env.SITE_URL ?? "https://jebew-final.vercel.app").replace(/\/$/, "");
  return [
    { url: dasar, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${dasar}/lacak`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${dasar}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];
}
