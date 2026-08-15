import { NextRequest, NextResponse } from "next/server";
import { COOKIE, serializeSessionCookie, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

function clearCookie(res: NextResponse) {
  const opts = sessionCookieOptions(0);
  res.cookies.set(COOKIE, "", { ...opts, maxAge: 0 });
  res.headers.set("Set-Cookie", serializeSessionCookie("", 0));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function publicOrigin(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

/** Only POST clears the session. GET must be a no-op — Next.js <Link> prefetches hrefs and was logging everyone out. */
export async function POST(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return clearCookie(NextResponse.redirect(new URL("/login", publicOrigin(req)), 303));
  }
  return clearCookie(NextResponse.json({ ok: true }));
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", publicOrigin(req)), 303);
}
