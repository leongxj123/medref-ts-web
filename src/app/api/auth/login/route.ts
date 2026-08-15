import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, checkPassword, signSession } from "@/lib/auth-shared";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const body = form
    ? { username: String(form.get("username") || ""), password: String(form.get("password") || "") }
    : ((await req.json().catch(() => ({}))) as { username?: string; password?: string });
  if (!checkPassword(body.username || "", body.password || "")) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }
  const token = await signSession(body.username || "");
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge: 14 * 24 * 3600,
  });
  return NextResponse.json({ ok: true });
}
