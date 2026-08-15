import Link from "next/link";
import { Crumb, GroupCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta, wikiPath } from "@/lib/data";
import { queryDisease, resolveWiki } from "@/lib/search";

export default async function DrugsForPage({
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
  const data = await queryDisease(name, page, 20, klass, nature);
  const canon = await resolveWiki(name);
  const base = `/drugs-for/${encodeURIComponent(name)}`;
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
        <Crumb items={[{ href: "/", label: "首页" }, { href: "/search", label: "药品" }, { label: name }]} />
        <div className="panel-head">
          <h1>相关药品：{name}</h1>
          <div className="muted">
            {data.total} 个通用名{" "}
            {canon ? (
              <Link className="ghost" href={wikiPath(canon)}>
                查看疾病百科
              </Link>
            ) : null}
          </div>
        </div>
        {data.groups.map((g) => (
          <GroupCard key={g.generic_name} g={g} />
        ))}
        {data.total === 0 ? <div className="empty">说明书库中没有标注该疾病的药品</div> : null}
        <Pager page={data.page} size={data.size} total={data.total} hrefFor={hrefFor} />
      </main>
    </div>
  );
}
