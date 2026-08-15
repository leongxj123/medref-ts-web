import { DrugCard, GroupCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta } from "@/lib/data";
import { searchDrugs } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string; nature?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const klass = sp.class || "";
  const nature = sp.nature || "";
  const page = Number(sp.page || "1") || 1;
  const meta = await getMeta();
  const hasQuery = Boolean(q.trim() || klass || nature);

  if (!hasQuery) {
    return (
      <div className="layout">
        <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} klass={klass} nature={nature} q={q} />
        <main>
          <div className="panel-head">
            <h1>药品检索</h1>
          </div>
          <p className="muted">请输入通用名、商品名、批准文号或拼音，也可在左侧选择分类 / 性质后再查询。</p>
        </main>
      </div>
    );
  }

  const data = await searchDrugs(q, klass, nature, page, 20);
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (klass) u.set("class", klass);
    if (nature) u.set("nature", nature);
    if (p > 1) u.set("page", String(p));
    return `/search?${u.toString()}`;
  };
  return (
    <div className="layout">
      <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} klass={klass} nature={nature} q={q} />
      <main>
        <div className="panel-head">
          <h1>{q ? `“${q}” 的结果` : "筛选结果"}</h1>
          <div className="muted">
            共 {data.total} {data.mode === "groups" ? "个通用名" : "条"}
          </div>
        </div>
        {data.mode === "groups"
          ? data.groups.map((g) => <GroupCard key={g.generic_name} g={g} />)
          : data.items.map((it) => <DrugCard key={it.id} it={it} />)}
        {data.total === 0 ? <div className="empty">没有匹配的药品</div> : null}
        <Pager page={data.page} size={data.size} total={data.total} hrefFor={qs} />
      </main>
    </div>
  );
}
