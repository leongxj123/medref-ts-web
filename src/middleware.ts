import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE, timingEqual } from "@/lib/auth-shared";

function secretBytes() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "");
}

async function hasSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || "";
  if (!token || secret.length < 16) return false;
  try {
    await jwtVerify(token, secretBytes());
    return true;
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
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (internalOk(req)) return NextResponse.next();

  const isLogin = pathname === "/login" || pathname === "/api/auth/login";
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

  if (pathname.startsWith("/api/") || pathname.startsWith("/data/")) {
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
