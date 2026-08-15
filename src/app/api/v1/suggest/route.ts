import { NextRequest, NextResponse } from "next/server";
import { suggest } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const mode = (req.nextUrl.searchParams.get("mode") || "home") as "home" | "drug" | "wiki";
  const items = await suggest(q, mode);
  return NextResponse.json({ ok: true, items });
}
