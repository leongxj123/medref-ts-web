import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { searchDrugs, searchWiki } from "@/lib/search";

export async function GET(req: NextRequest) {
  const rl = rateLimit(`search:${clientKey(req)}`, 90, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const q = req.nextUrl.searchParams.get("q") || "";
  const scope = req.nextUrl.searchParams.get("scope") || "all";
  const page = Number(req.nextUrl.searchParams.get("page") || "1") || 1;
  const size = Number(req.nextUrl.searchParams.get("size") || "10") || 10;
  const klass = req.nextUrl.searchParams.get("class") || "";
  const nature = req.nextUrl.searchParams.get("nature") || "";
  const dept = req.nextUrl.searchParams.get("dept") || "";
  if (!q && scope === "all") {
    return NextResponse.json({ ok: false, error: "missing_q" }, { status: 400 });
  }
  if (scope === "wiki") {
    const wiki = await searchWiki(q, dept, page, size);
    return NextResponse.json({
      ok: true,
      scope,
      total: wiki.total,
      page: wiki.page,
      items: wiki.items.map((p) => ({
        name: p[1],
        dept: p[2],
        sub: p[3],
        yibao: p[5],
        symptoms: p[6],
      })),
    });
  }
  if (scope === "drug") {
    const drugs = await searchDrugs(q, klass, nature, page, size);
    return NextResponse.json({ ok: true, scope, ...drugs });
  }
  const wiki = await searchWiki(q, "", 1, Math.min(size, 8));
  const drugs = await searchDrugs(q, "", "", 1, Math.min(size, 8));
  return NextResponse.json({
    ok: true,
    scope: "all",
    wiki: {
      total: wiki.total,
      items: wiki.items.map((p) => ({ name: p[1], dept: p[2], symptoms: p[6] })),
    },
    drugs,
  });
}
