import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Kunci publik VAPID untuk langganan web push. */
export async function GET() {
  return NextResponse.json({ kunci: (process.env.VAPID_PUBLIC_KEY ?? "").trim() });
}
