import Link from "next/link";
import { DrugCard, GroupCard, WikiCard } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta } from "@/lib/data";
import { searchDrugs, searchWiki } from "@/lib/search";

export default async function AllPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const meta = await getMeta();
  const wiki = await searchWiki(q, "", 1, 6);
  const drugs = await searchDrugs(q, "", "", 1, 8);
  return (
    <div className="layout">
      <Filters mode="home" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} q={q} />
      <main>
        <div className="panel-head">
          <h1>综合结果：{q}</h1>
        </div>
        <div className="panel-head">
          <h2>疾病</h2>
          <Link className="ghost" href={`/wiki/search?q=${encodeURIComponent(q)}`}>
            查看全部 {wiki.total} 条
          </Link>
        </div>
        {wiki.items.map((p) => (
          <WikiCard key={p[0]} p={p} />
        ))}
        {wiki.total === 0 ? <div className="empty">没有匹配的疾病</div> : null}
        <div className="panel-head" style={{ marginTop: 22 }}>
          <h2>药品</h2>
          <Link className="ghost" href={`/search?q=${encodeURIComponent(q)}`}>
            查看全部 {drugs.total}
          </Link>
        </div>
        {drugs.mode === "groups"
          ? drugs.groups.map((g) => <GroupCard key={g.generic_name} g={g} />)
          : drugs.items.map((it) => <DrugCard key={it.id} it={it} />)}
        {drugs.total === 0 ? <div className="empty">没有匹配的药品</div> : null}
      </main>
    </div>
  );
}
