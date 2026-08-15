import { Crumb, DrugCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { Toolbar } from "@/components/ClientBits";
import { getMeta } from "@/lib/data";
import { queryGeneric } from "@/lib/search";

export default async function GenericPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const page = Number((await searchParams).page || "1") || 1;
  const meta = await getMeta();
  const data = await queryGeneric(name, page, 40);
  return (
    <div className="layout">
      <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} />
      <main>
        <Crumb items={[{ href: "/", label: "首页" }, { href: "/search", label: "药品" }, { label: data.generic_name }]} />
        {data.total ? (
          <Toolbar item={{ t: "generic", name: data.generic_name, title: data.generic_name, sub: "通用名" }} />
        ) : null}
        <div className="panel-head">
          <h1>{data.generic_name}</h1>
          <div className="muted">{data.total} 个批准文号 / 规格 / 厂家</div>
        </div>
        <div className="pills" style={{ marginBottom: 14 }}>
          {data.brands.map((b) => (
            <span className="pill" key={b}>
              {b}
            </span>
          ))}
        </div>
        {data.items.map((it) => (
          <DrugCard key={it.id} it={it} />
        ))}
        {data.total === 0 ? (
          <div className="empty">
            没有找到「{name}」。
            <a className="ghost" href={`/search?q=${encodeURIComponent(name)}`}>
              改为检索
            </a>
          </div>
        ) : null}
        <Pager
          page={data.page}
          size={data.size}
          total={data.total}
          hrefFor={(p) => `/generic/${encodeURIComponent(name)}?page=${p}`}
        />
      </main>
    </div>
  );
}
