import { NextRequest, NextResponse } from "next/server";
import { checkPassword, safeNextPath, signSession } from "@/lib/auth-shared";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { COOKIE, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicOrigin(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function originAllowed(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin navigational POST may omit Origin in some browsers
  try {
    return new URL(origin).host === new URL(publicOrigin(req)).host;
  } catch {
    return false;
  }
}

function attachSession(res: NextResponse, token: string, req: NextRequest) {
  res.cookies.set(COOKIE, token, sessionCookieOptions(undefined, req));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`login:${clientKey(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  if (!originAllowed(req)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

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

  const nextPath = safeNextPath(nextRaw);
  const origin = publicOrigin(req);
  const hasUser = Boolean(process.env.AUTH_USERNAME?.trim());
  const hasSecret = Boolean(process.env.AUTH_SECRET?.trim());
  const hasPass = Boolean(process.env.AUTH_PASSWORD?.trim() || process.env.AUTH_PASSWORD_HASH?.trim());

  if (!hasUser || !hasPass || !hasSecret) {
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
