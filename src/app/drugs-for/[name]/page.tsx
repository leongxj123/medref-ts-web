import Link from "next/link";
import { Crumb, GroupCard, Pager } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { getMeta, wikiPath } from "@/lib/data";
import { queryDisease, resolveWiki } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function DrugsForPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const name = decodeURIComponent((await params).name);
  const page = Number((await searchParams).page || "1") || 1;
  const meta = await getMeta();
  const data = await queryDisease(name, page, 20);
  const canon = await resolveWiki(name);
  return (
    <div className="layout">
      <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} />
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
        <Pager
          page={data.page}
          size={data.size}
          total={data.total}
          hrefFor={(p) => `/drugs-for/${encodeURIComponent(name)}?page=${p}`}
        />
      </main>
    </div>
  );
}
