import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/auth-shared";

function clear() {
  return cookies().then((jar) => {
    jar.delete(COOKIE);
  });
}

export async function POST() {
  await clear();
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  await clear();
  return NextResponse.redirect(new URL("/login", req.url));
}
