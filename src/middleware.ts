import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, COOKIE, verifySessionToken } from "@/lib/session-crypto";

function timingEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hasSession(req: NextRequest) {
  let token = req.cookies.get(COOKIE)?.value || "";
  if (token.includes("%")) {
    try {
      token = decodeURIComponent(token);
    } catch {
      /* keep raw */
    }
  }
  const secret = process.env.AUTH_SECRET?.trim() || "";
  if (!token || secret.length < 16) return false;
  try {
    return Boolean(await verifySessionToken(token, secret));
  } catch {
    return false;
  }
}

function apiKeyOk(req: NextRequest) {
  const expect = process.env.API_KEY?.trim() || "";
  if (!expect) return false;
  const header = req.headers.get("authorization") || "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  const given = bearer || req.headers.get("x-api-key") || "";
  return given ? timingEqual(given, expect) : false;
}

function withHeaders(res: NextResponse) {
  applySecurityHeaders(res);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return withHeaders(NextResponse.next());
  }

  // Corpus must not be publicly downloadable.
  if (pathname.startsWith("/data/")) {
    return withHeaders(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  const isLogin = pathname === "/login" || pathname === "/api/auth/login";
  const isLogout = pathname === "/api/auth/logout";
  const isApi = pathname.startsWith("/api/v1");
  const session = await hasSession(req);

  if (isApi && (apiKeyOk(req) || session)) return withHeaders(NextResponse.next());
  if (isLogin) {
    if (session && pathname === "/login") {
      return withHeaders(NextResponse.redirect(new URL("/", req.url)));
    }
    return withHeaders(NextResponse.next());
  }
  if (isLogout) return withHeaders(NextResponse.next());
  if (session) return withHeaders(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return withHeaders(NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }));
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
  return withHeaders(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
