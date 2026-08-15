import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Returns which auth env vars are present (never the values). */
export async function GET() {
  const secret = process.env.AUTH_SECRET?.trim() || "";
  return NextResponse.json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    env: process.env.VERCEL_ENV || null,
    has: {
      AUTH_USERNAME: Boolean(process.env.AUTH_USERNAME?.trim()),
      AUTH_PASSWORD: Boolean(process.env.AUTH_PASSWORD?.trim()),
      AUTH_SECRET: secret.length >= 16,
      API_KEY: Boolean(process.env.API_KEY?.trim()),
    },
    authSecretLength: secret.length,
  });
}
