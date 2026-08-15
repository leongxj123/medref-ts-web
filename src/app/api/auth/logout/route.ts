import { NextRequest, NextResponse } from "next/server";
import { COOKIE, serializeSessionCookie, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

function clearCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  res.headers.append("Set-Cookie", serializeSessionCookie("", 0));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function publicOrigin(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export async function POST() {
  return clearCookie(NextResponse.json({ ok: true }));
}

export async function GET(req: NextRequest) {
  return clearCookie(NextResponse.redirect(new URL("/login", publicOrigin(req)), 303));
}
