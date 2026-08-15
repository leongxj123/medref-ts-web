import { NextRequest, NextResponse } from "next/server";

const COOKIE = "medref_session";

function timingEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function b64urlToBytes(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyHs256(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, sig] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(`${header}.${payload}`)
  );
  if (!ok) return false;
  try {
    const json = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))) as { exp?: number };
    if (json.exp && json.exp * 1000 < Date.now()) return false;
  } catch {
    return false;
  }
  return true;
}

async function hasSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || "";
  if (!token || secret.length < 16) return false;
  try {
    return await verifyHs256(token, secret);
  } catch {
    return false;
  }
}

function apiKeyOk(req: NextRequest) {
  const expect = process.env.API_KEY || "";
  if (!expect) return false;
  const header = req.headers.get("authorization") || "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  const given = bearer || req.headers.get("x-api-key") || "";
  return given ? timingEqual(given, expect) : false;
}

function internalOk(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || "";
  const token = req.headers.get("x-internal-token") || "";
  return secret.length >= 16 && token.length > 0 && timingEqual(token, secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static corpus must be readable by SSR (and CDN). UI/API remain auth-gated.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/data/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (internalOk(req)) return NextResponse.next();

  const isLogin =
    pathname === "/login" || pathname === "/api/auth/login" || pathname === "/api/auth/status";
  const isLogout = pathname === "/api/auth/logout";
  const isApi = pathname.startsWith("/api/v1");
  const session = await hasSession(req);

  if (isApi && (apiKeyOk(req) || session)) return NextResponse.next();
  if (isLogin) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }
  if (isLogout) return NextResponse.next();
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
