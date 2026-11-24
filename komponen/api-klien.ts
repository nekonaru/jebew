// Pembantu untuk menangani respons API dari komponen klien admin.

"use client";

export async function ambilJson<T>(jawaban: Response): Promise<T> {
  if (jawaban.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Sesi berakhir");
  }
  if (!jawaban.ok) {
    const isi = (await jawaban.json().catch(() => ({}))) as { pesan?: string };
    throw new Error(isi.pesan ?? "Permintaan gagal");
  }
  return jawaban.json() as Promise<T>;
}
