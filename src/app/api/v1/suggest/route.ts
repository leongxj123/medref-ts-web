import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { suggest } from "@/lib/search";

export async function GET(req: NextRequest) {
  const rl = rateLimit(`suggest:${clientKey(req)}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const q = req.nextUrl.searchParams.get("q") || "";
  const mode = (req.nextUrl.searchParams.get("mode") || "home") as "home" | "drug" | "wiki";
  const items = await suggest(q, mode);
  return NextResponse.json({ ok: true, items });
}
