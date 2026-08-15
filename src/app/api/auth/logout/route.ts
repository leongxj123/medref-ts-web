import { NextRequest, NextResponse } from "next/server";
import { COOKIE, serializeSessionCookie, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

function clearCookie(res: NextResponse, req?: NextRequest) {
  res.cookies.set(COOKIE, "", { ...sessionCookieOptions(0, req), maxAge: 0 });
  res.headers.set("Set-Cookie", serializeSessionCookie("", 0, req));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function publicOrigin(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

/** Only POST clears the session. GET must be a no-op — Link prefetch must not log users out. */
export async function POST(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return clearCookie(NextResponse.redirect(new URL("/login", publicOrigin(req)), 303), req);
  }
  return clearCookie(NextResponse.json({ ok: true }), req);
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", publicOrigin(req)), 303);
}
