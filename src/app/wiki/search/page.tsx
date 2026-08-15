import { Pager, WikiCard } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta, getWikiPack } from "@/lib/data";
import { searchWiki } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function WikiSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const dept = sp.dept || "";
  const page = Number(sp.page || "1") || 1;
  const meta = await getMeta();
  const wiki = await getWikiPack();
  const data = await searchWiki(q, dept, page, 20);
  const title = q ? `疾病：“${q}”` : dept || "疾病列表";
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (dept) u.set("dept", dept);
    if (p > 1) u.set("page", String(p));
    return `/wiki/search?${u.toString()}`;
  };
  return (
    <div className="layout">
      <Filters mode="wiki" classes={meta.classes} natures={meta.natures} depts={wiki.depts} dept={dept} q={q} />
      <main>
        <div className="panel-head">
          <h1>{title}</h1>
          <div className="muted">共 {data.total} 条</div>
        </div>
        {data.items.map((p) => (
          <WikiCard key={p[0]} p={p} />
        ))}
        {data.total === 0 ? <div className="empty">没有匹配的疾病</div> : null}
        <Pager page={data.page} size={data.size} total={data.total} hrefFor={hrefFor} />
      </main>
    </div>
  );
}
