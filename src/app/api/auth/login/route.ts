import { NextRequest, NextResponse } from "next/server";
import { checkPassword, signSession } from "@/lib/auth-shared";
import { COOKIE, sessionCookieOptions } from "@/lib/session-crypto";

export const dynamic = "force-dynamic";

function safeNext(raw: string | null, req: NextRequest) {
  const next = (raw || "/").trim() || "/";
  if (!next.startsWith("/") || next.startsWith("//")) return new URL("/", req.url);
  return new URL(next, req.url);
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

  if (!process.env.AUTH_USERNAME?.trim() || !process.env.AUTH_PASSWORD?.trim() || !process.env.AUTH_SECRET?.trim()) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login?error=env", req.url));
  }

  if (!checkPassword(username, password)) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }
    const u = new URL("/login", req.url);
    u.searchParams.set("error", "1");
    u.searchParams.set("next", nextRaw.startsWith("/") ? nextRaw : "/");
    return NextResponse.redirect(u);
  }

  const token = await signSession(username);
  const wantsJson = contentType.includes("application/json");
  const res = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(safeNext(nextRaw, req));
  res.cookies.set(COOKIE, token, sessionCookieOptions());
  return res;
}
