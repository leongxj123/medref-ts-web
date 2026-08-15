import { NextResponse } from "next/server";
import { getMeta } from "@/lib/data";

export async function GET() {
  const meta = await getMeta().catch(() => null);
  return NextResponse.json({
    ok: true,
    docs: "/api/v1/openapi",
    endpoints: [
      "GET /api/v1/search?q=&scope=all|drug|wiki",
      "GET /api/v1/suggest?q=",
      "GET /api/v1/drugs/{id}",
      "GET /api/v1/generics/{name}",
      "GET /api/v1/diseases/{name}",
      "GET /api/v1/drugs-for/{name}",
      "GET /api/v1/openapi",
    ],
    meta,
    auth: "Authorization: Bearer $API_KEY",
  });
}
