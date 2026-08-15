import { NextResponse } from "next/server";
import { getDrugDetail } from "@/lib/data";
import { resolveWiki } from "@/lib/search";
import { SECTION_LABELS } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = await getDrugDetail(id);
  if (!d) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const diseases = [];
  for (const name of d.diseases) {
    const canon = (await resolveWiki(name)) || "";
    diseases.push({ name, wiki: Boolean(canon), canonical: canon || name });
  }
  const sections: Record<string, string> = {};
  for (const [k, label] of Object.entries(SECTION_LABELS)) {
    if (d.sections[k]) sections[label] = d.sections[k];
  }
  return NextResponse.json({
    ok: true,
    drug: {
      id: d.id,
      generic_name: d.generic_name,
      brand_name: d.brand_name,
      pinyin: d.pinyin,
      approval_no: d.approval_no,
      classification: d.classification,
      nature: d.nature,
      manufacturer: d.manufacturer,
      spec: d.spec,
    },
    diseases,
    sections,
  });
}
