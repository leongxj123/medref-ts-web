import Link from "next/link";
import { Filters } from "@/components/Filters";
import { getMeta, getWikiPack } from "@/lib/data";

export default async function WikiHome() {
  const meta = await getMeta();
  const wiki = await getWikiPack();
  return (
    <div className="layout">
      <Filters mode="wiki" classes={meta.classes} natures={meta.natures} depts={wiki.depts} />
      <main>
        <div className="panel-head">
          <h1>疾病百科</h1>
          <div className="muted">{wiki.total.toLocaleString()} 条</div>
        </div>
        <div className="chips">
          {wiki.depts.map((d) => (
            <Link key={d} className="chip" href={`/wiki/search?dept=${encodeURIComponent(d)}`}>
              {d}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
