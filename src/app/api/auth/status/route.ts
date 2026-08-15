import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySessionToken } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

/** Authenticated health check — no secret lengths or env inventory. */
export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET?.trim() || "";
  const token = req.cookies.get(COOKIE)?.value || "";
  let authed = false;
  if (token && secret.length >= 16) {
    try {
      authed = Boolean(await verifySessionToken(token, secret));
    } catch {
      authed = false;
    }
  }
  if (!authed) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const configured = Boolean(
    process.env.AUTH_USERNAME?.trim() &&
      (process.env.AUTH_PASSWORD?.trim() || process.env.AUTH_PASSWORD_HASH?.trim()) &&
      secret.length >= 16
  );
  return NextResponse.json({
    ok: true,
    configured,
    apiKeyConfigured: Boolean(process.env.API_KEY?.trim()),
  });
}
