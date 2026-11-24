"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Tombol({
  children, onClick, jenis = "utama", tipe = "button", nonaktif = false,
  kelas = "", nama = "", ditekan,
}: {
  children: ReactNode;
  onClick?: () => void;
  jenis?: "utama" | "sekunder" | "hapus" | "sukses" | "kosong";
  tipe?: "button" | "submit";
  nonaktif?: boolean;
  kelas?: string;
  nama?: string;
  ditekan?: boolean;
}) {
  const gaya = {
    utama: "bg-utama text-white hover:bg-utama-gelap shadow-sm",
    sekunder: "border border-garis bg-white text-tinta hover:bg-latar",
    hapus: "bg-red-50 text-bahaya hover:bg-red-100",
    sukses: "bg-sukses text-white hover:brightness-95",
    kosong: "text-utama hover:bg-red-50",
  }[jenis];
  return (
    <button
      type={tipe} name={nama} aria-pressed={ditekan} disabled={nonaktif} onClick={onClick}
      className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-[var(--gerak-cepat)] ease-[var(--ease-halus)] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none ${gaya} ${kelas}`}
    >
      {children}
    </button>
  );
}

export function Kartu({ children, kelas = "" }: { children: ReactNode; kelas?: string }) {
  return (
    <section className={`rounded-kartu border border-garis bg-permukaan p-5 shadow-kartu ${kelas}`}>
      {children}
    </section>
  );
}

export function Judul({
  anak, sub, aksi,
}: { anak: string; sub?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{anak}</h1>
        {sub && <p className="mt-1 text-sm text-tinta-lemah">{sub}</p>}
      </div>
      {aksi}
    </div>
  );
}

export function Badge({
  children, warna = "netral",
}: { children: ReactNode; warna?: "netral" | "sukses" | "bahaya" | "peringatan" | "info" }) {
  const gaya = {
    netral: "bg-latar text-tinta-lemah",
    sukses: "bg-sukses-terang text-sukses",
    bahaya: "bg-red-50 text-bahaya",
    peringatan: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-info",
  }[warna];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${gaya}`}>{children}</span>;
}

export function Statistik({
  label, nilai, keterangan, aksen = false,
}: { label: string; nilai: string; keterangan?: string; aksen?: boolean }) {
  return (
    <Kartu kelas={aksen ? "border-l-4 border-l-utama" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wide text-tinta-lemah">{label}</p>
      <p className="mt-2 font-judul text-2xl font-semibold">{nilai}</p>
      {keterangan && <p className="mt-1 text-xs text-tinta-lemah">{keterangan}</p>}
    </Kartu>
  );
}

export function Dialog({
  terbuka, judul, children, padaTutup, lebar = "36rem",
}: {
  terbuka: boolean; judul: string; children: ReactNode; padaTutup: () => void; lebar?: string;
}) {
  const acuan = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = acuan.current;
    if (!el) return;
    if (terbuka && !el.open) el.showModal();
    if (!terbuka && el.open) el.close();
  }, [terbuka]);
  return (
    <dialog
      ref={acuan}
      aria-labelledby={`dlg-${judul.replace(/\s+/g, "-").toLowerCase()}`}
      onClose={padaTutup}
      onClick={(e) => { if (e.target === acuan.current) padaTutup(); }}
      className="w-[min(100%-2rem,var(--lebar))]"
      style={{ ["--lebar" as string]: lebar }}
    >
      <div className="flex items-center justify-between border-b border-garis px-5 py-4">
        <h2 id={`dlg-${judul.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-semibold">{judul}</h2>
        <Tombol jenis="kosong" onClick={padaTutup} kelas="min-h-[36px] px-2">Tutup</Tombol>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}

export function Pesan({ teks, jenis = "info" }: { teks: string; jenis?: "info" | "sukses" | "galat" }) {
  if (!teks) return null;
  const gaya = {
    info: "border-blue-200 bg-blue-50 text-info",
    sukses: "border-green-200 bg-sukses-terang text-sukses",
    galat: "border-red-200 bg-red-50 text-bahaya",
  }[jenis];
  return (
    <p role={jenis === "galat" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${gaya}`}>
      {teks}
    </p>
  );
}

export function Tabel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-kartu border border-garis bg-permukaan">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function KepalaTabel({ children }: { children: ReactNode }) {
  return <thead className="border-b border-garis bg-latar text-[11px] uppercase tracking-wide text-tinta-lemah">{children}</thead>;
}

export function SelKepala({ children }: { children: ReactNode }) {
  return <th scope="col" className="px-4 py-3 font-semibold">{children}</th>;
}

export function BarisKosong({ kolom, teks }: { kolom: number; teks: string }) {
  return <tr><td colSpan={kolom} className="px-4 py-10 text-center text-sm text-tinta-lemah">{teks}</td></tr>;
}
