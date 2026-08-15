import { NextResponse } from "next/server";
import { queryGeneric } from "@/lib/search";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1") || 1;
  const data = await queryGeneric(name, page, Number(url.searchParams.get("size") || "20") || 20);
  return NextResponse.json({
    ok: true,
    generic_name: data.generic_name,
    total: data.total,
    brands: data.brands,
    items: data.items.map((it) => ({
      id: it.id,
      brand_name: it.brand_name,
      approval_no: it.approval_no,
      manufacturer: it.manufacturer,
      spec: it.spec,
      nature: it.nature,
    })),
  });
}
