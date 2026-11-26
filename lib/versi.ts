// Versi aplikasi dibaca dari package.json di server.
import { readFileSync } from "node:fs";
import path from "node:path";

/** Nomor versi Jebew yang sedang berjalan. */
export function versiAplikasi(): string {
  try {
    const isi = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      version?: string;
    };
    return isi.version ?? "tidak diketahui";
  } catch {
    return "tidak diketahui";
  }
}
