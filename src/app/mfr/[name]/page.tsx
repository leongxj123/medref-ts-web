import { DrugCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta } from "@/lib/data";
import { queryMfr } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function MfrPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const name = decodeURIComponent((await params).name);
  const page = Number((await searchParams).page || "1") || 1;
  const meta = await getMeta();
  const data = await queryMfr(name, page, 20);
  return (
    <div className="layout">
      <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} />
      <main>
        <div className="panel-head">
          <h1>{name}</h1>
          <div className="muted">{data.total} 条说明书</div>
        </div>
        {data.items.map((it) => (
          <DrugCard key={it.id} it={it} />
        ))}
        <Pager page={data.page} size={data.size} total={data.total} hrefFor={(p) => `/mfr/${encodeURIComponent(name)}?page=${p}`} />
      </main>
    </div>
  );
}
