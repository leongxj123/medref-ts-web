import { NextResponse } from "next/server";
import { getWikiDetail, getWikiPack } from "@/lib/data";
import { queryDisease, resolveWiki } from "@/lib/search";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const canon = (await resolveWiki(name)) || name;
  const wiki = await getWikiPack();
  const id = wiki.rows.find((r) => r[1] === canon)?.[0];
  if (!id) {
    const related = await queryDisease(name, 1, 20);
    return NextResponse.json({ ok: true, found: false, name, related: related.groups.map((g) => g.generic_name) });
  }
  const d = await getWikiDetail(id);
  if (!d) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const related = await queryDisease(d.name, 1, 12);
  return NextResponse.json({
    ok: true,
    found: true,
    disease: {
      name: d.name,
      dept: d.dept,
      sub: d.sub,
      yibao_status: d.yibao_status,
      get_way: d.get_way,
      easy_get: d.easy_get || d.get_prob,
      cure_way: d.cure_way,
      cure_lasttime: d.cure_lasttime,
      cured_prob: d.cured_prob,
      cost_money: d.cost_money,
      symptom: d.symptom,
      check: d.check,
      acompany: d.acompany,
      common_drug: d.common_drug.map((x) => x.label),
      recommand_drug: d.recommand_drug.map((x) => x.label),
      sections: d.sections,
      diet: { do_eat: d.do_eat, not_eat: d.not_eat, recommand_eat: d.recommand_eat },
    },
    related_generics: related.groups.map((g) => ({ generic_name: g.generic_name, count: g.count })),
  });
}
