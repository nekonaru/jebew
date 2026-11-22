"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Tombol } from "./ui.tsx";

export default function FormulirLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pesan, setPesan] = useState("");
  const [sedangKirim, setSedangKirim] = useState(false);

  async function masuk(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    setSedangKirim(true);
    setPesan("");
    try {
      const jawaban = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(data.pesan ?? "Gagal masuk");
      router.push("/admin");
      router.refresh();
    } catch (kesalahan) {
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal masuk");
      setSedangKirim(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-krem px-4">
      <div className="w-full max-w-sm rounded-2xl border border-tepi bg-white p-7 shadow-kartu">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={64} height={64} className="mx-auto" />
          <h1 className="mt-4 text-2xl font-semibold">Masuk admin</h1>
          <p className="mt-1 text-sm text-coklatMuda">Masukkan PIN untuk mengelola Jebew.</p>
        </div>
        <form onSubmit={masuk} className="space-y-4">
          <div>
            <label htmlFor="pin">PIN admin</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              maxLength={12}
              value={pin}
              onChange={(peristiwa) => setPin(peristiwa.target.value)}
            />
          </div>
          {pesan && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</p>}
          <Tombol tipe="submit" nonaktif={sedangKirim} kelas="w-full">
            {sedangKirim ? "Memeriksa..." : "Masuk"}
          </Tombol>
        </form>
        <p className="mt-5 text-center text-xs text-coklatMuda">
          Untuk demo, PIN bawaan adalah 1234. Ganti lewat variabel ADMIN_PIN.
        </p>
      </div>
    </div>
  );
}
