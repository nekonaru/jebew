// Komponen tampilan yang dipakai bersama oleh halaman konsumen dan dashboard.

"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Tombol({
  children,
  onClick,
  jenis = "utama",
  tipe = "button",
  nonaktif = false,
  kelas = "",
  nama = "",
  ditekan,
}: {
  children: ReactNode;
  onClick?: () => void;
  jenis?: "utama" | "sekunder" | "bahaya" | "sukses";
  tipe?: "button" | "submit";
  nonaktif?: boolean;
  kelas?: string;
  nama?: string;
  ditekan?: boolean;
}) {
  const gaya = {
    utama: "bg-bata text-white hover:bg-bataGelap",
    sekunder: "border border-tepi bg-white text-coklat hover:bg-krem",
    bahaya: "bg-red-50 text-red-700 hover:bg-red-100",
    sukses: "bg-sukses text-white hover:bg-green-700",
  }[jenis];

  return (
    <button
      type={tipe}
      name={nama}
      aria-pressed={ditekan}
      onClick={onClick}
      disabled={nonaktif}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${gaya} ${kelas}`}
    >
      {children}
    </button>
  );
}

export function Kartu({
  children,
  kelas = "",
}: {
  children: ReactNode;
  kelas?: string;
}) {
  return (
    <section className={`rounded-2xl border border-tepi bg-white p-5 shadow-kartu ${kelas}`}>
      {children}
    </section>
  );
}

export function Pesan({
  teks,
  jenis = "info",
}: {
  teks: string;
  jenis?: "info" | "sukses" | "galat";
}) {
  if (!teks) return null;
  const gaya = {
    info: "border-oranye/30 bg-krem text-coklatMuda",
    sukses: "border-green-200 bg-green-50 text-green-800",
    galat: "border-red-200 bg-red-50 text-red-700",
  }[jenis];

  return (
    <p role={jenis === "galat" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${gaya}`}>
      {teks}
    </p>
  );
}

export function LabelStatus({
  tersedia,
  porsi,
}: {
  tersedia: boolean;
  porsi: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          tersedia ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"
        }`}
      >
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tersedia ? "bg-sukses" : "bg-stone-500"}`} />
        {tersedia ? "Tersedia" : "Habis"}
      </span>
      {tersedia && porsi <= 5 && (
        <span className="rounded-full bg-oranye/15 px-3 py-1 text-xs font-semibold text-oranye">
          Sisa {porsi} porsi
        </span>
      )}
    </div>
  );
}

export function Dialog({
  terbuka,
  judul,
  children,
  padaTutup,
}: {
  terbuka: boolean;
  judul: string;
  children: ReactNode;
  padaTutup: () => void;
}) {
  const acuan = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemen = acuan.current;
    if (!elemen) return;
    if (terbuka && !elemen.open) elemen.showModal();
    if (!terbuka && elemen.open) elemen.close();
  }, [terbuka]);

  return (
    <dialog
      ref={acuan}
      aria-labelledby={`judul-dialog-${judul.replace(/\s+/g, "-").toLowerCase()}`}
      onClose={padaTutup}
      onClick={(peristiwa) => {
        if (peristiwa.target === acuan.current) padaTutup();
      }}
    >
      <div className="flex items-center justify-between border-b border-tepi px-5 py-4">
        <h2 id={`judul-dialog-${judul.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-semibold">
          {judul}
        </h2>
        <Tombol onClick={padaTutup} jenis="sekunder" kelas="min-h-[40px] px-3">
          Tutup
        </Tombol>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}

export function Penanda({
  children,
  warna = "krem",
}: {
  children: ReactNode;
  warna?: "krem" | "hijau" | "merah";
}) {
  const gaya = {
    krem: "bg-krem text-coklatMuda",
    hijau: "bg-green-100 text-green-800",
    merah: "bg-red-100 text-red-700",
  }[warna];
  return <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${gaya}`}>{children}</span>;
}
