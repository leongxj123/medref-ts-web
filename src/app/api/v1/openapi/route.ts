import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.json(buildOpenApi(origin));
}
