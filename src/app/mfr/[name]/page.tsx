import { DrugCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta } from "@/lib/data";
import { queryMfr } from "@/lib/search";

export default async function MfrPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string; class?: string; nature?: string }>;
}) {
  const name = decodeURIComponent((await params).name);
  const sp = await searchParams;
  const page = Number(sp.page || "1") || 1;
  const klass = sp.class || "";
  const nature = sp.nature || "";
  const meta = await getMeta();
  const data = await queryMfr(name, page, 20, klass, nature);
  const base = `/mfr/${encodeURIComponent(name)}`;
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (klass) u.set("class", klass);
    if (nature) u.set("nature", nature);
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return qs ? `${base}?${qs}` : base;
  };
  return (
    <div className="layout">
      <Filters
        mode="drug"
        classes={meta.classes}
        natures={meta.natures}
        depts={meta.wikiDepts}
        klass={klass}
        nature={nature}
        basePath={base}
      />
      <main>
        <div className="panel-head">
          <h1>{name}</h1>
          <div className="muted">{data.total} 条说明书</div>
        </div>
        {data.items.map((it) => (
          <DrugCard key={it.id} it={it} />
        ))}
        {data.total === 0 ? <div className="empty">没有匹配的说明书</div> : null}
        <Pager page={data.page} size={data.size} total={data.total} hrefFor={hrefFor} />
      </main>
    </div>
  );
}
