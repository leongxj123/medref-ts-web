import { NextResponse } from "next/server";
import { queryDisease } from "@/lib/search";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1") || 1;
  const data = await queryDisease(name, page, Number(url.searchParams.get("size") || "20") || 20);
  return NextResponse.json({
    ok: true,
    disease: data.disease,
    total: data.total,
    groups: data.groups.map((g) => ({ generic_name: g.generic_name, count: g.count, classification: g.classification })),
  });
}
