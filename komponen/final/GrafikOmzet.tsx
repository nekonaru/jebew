"use client";

import { formatAngka, formatRupiah } from "@/lib/format.ts";

export type TitikOmzet = { tanggal: string; omzet: number; transaksi: number };

/** Grafik batang omzet tujuh hari terakhir. Murni CSS, tanpa pustaka grafik. */
export default function GrafikOmzet({ data }: { data: TitikOmzet[] }) {
  const titik = data.length > 0 ? data : [];
  const maks = Math.max(1, ...titik.map((d) => d.omzet));
  const total = titik.reduce((n, d) => n + d.omzet, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Omzet 7 hari terakhir</h2>
          <p className="mt-1 text-xs text-tinta-lemah">Total {formatRupiah(total)}</p>
        </div>
        <span className="rounded-full bg-latar px-3 py-1 text-[11px] font-semibold text-tinta-lemah">WIB</span>
      </div>

      <div
        role="img"
        aria-label={`Omzet tujuh hari terakhir, total ${formatRupiah(total)}`}
        className="mt-5 flex h-44 items-end gap-2 sm:gap-3"
      >
        {titik.map((d) => {
          const persen = Math.max(3, Math.round((d.omzet / maks) * 100));
          const [, bulan, hari] = d.tanggal.split("-");
          return (
            <div key={d.tanggal} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-semibold text-tinta-lemah">
                {d.omzet > 0 ? formatAngka(Math.round(d.omzet / 1000)) + "rb" : "-"}
              </span>
              <div
                className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-utama to-utama-terang transition-[height] duration-500 ease-[var(--ease-halus)]"
                style={{ height: `${persen}%` }}
                title={`${d.tanggal}: ${formatRupiah(d.omzet)}, ${d.transaksi} transaksi`}
              />
              <span className="text-[10px] font-medium text-tinta-lemah">{hari}/{bulan}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
