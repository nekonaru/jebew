import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().min(10).max(300),
  auth: z.string().min(10).max(300),
}).strict();

/** Simpan langganan web push per perangkat. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await jalankan(
      `INSERT INTO push_subscription (pengguna_id, endpoint, p256dh, auth)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE SET pengguna_id = EXCLUDED.pengguna_id,
       p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [pengguna!.id, badan.endpoint, badan.p256dh, badan.auth],
    );
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
