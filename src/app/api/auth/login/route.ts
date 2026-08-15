import { NextRequest, NextResponse } from "next/server";
import { checkPassword, signSession } from "@/lib/auth-shared";
import { COOKIE, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicOrigin(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function safePath(raw: string | null) {
  const next = (raw || "/").trim() || "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function attachSession(res: NextResponse, token: string, req: NextRequest) {
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  const secure = proto === "https" || process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, token, { ...sessionCookieOptions(), secure });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let username = "";
  let password = "";
  let nextRaw = "/";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
      next?: string;
    };
    username = String(body.username || "");
    password = String(body.password || "");
    nextRaw = String(body.next || "/");
  } else {
    const form = await req.formData().catch(() => null);
    username = String(form?.get("username") || "");
    password = String(form?.get("password") || "");
    nextRaw = String(form?.get("next") || "/");
  }

  const nextPath = safePath(nextRaw);
  const origin = publicOrigin(req);

  if (!process.env.AUTH_USERNAME?.trim() || !process.env.AUTH_PASSWORD?.trim() || !process.env.AUTH_SECRET?.trim()) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login?error=env", origin), 303);
  }

  if (!checkPassword(username, password)) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }
    const u = new URL("/login", origin);
    u.searchParams.set("error", "1");
    u.searchParams.set("next", nextPath);
    return NextResponse.redirect(u, 303);
  }

  const token = await signSession(username.trim());
  const wantsJson = contentType.includes("application/json");

  if (wantsJson) {
    return attachSession(NextResponse.json({ ok: true }), token, req);
  }

  return attachSession(NextResponse.redirect(new URL(nextPath, origin), 303), token, req);
}
