import { NextRequest, NextResponse } from "next/server";
import { COOKIE, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

function clearCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}

export async function POST() {
  return clearCookie(NextResponse.json({ ok: true }));
}

export async function GET(req: NextRequest) {
  return clearCookie(NextResponse.redirect(new URL("/login", req.url)));
}
