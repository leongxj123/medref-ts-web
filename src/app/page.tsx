import Link from "next/link";
import { Filters } from "@/components/Filters";
import { HomeLists } from "@/components/ClientBits";
import { getMeta } from "@/lib/data";
import { DISCLAIMER } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const meta = await getMeta();
  return (
    <div className="layout">
      <Filters mode="home" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} />
      <main>
        <section className="hero">
          <h1>药品说明书与疾病百科</h1>
          <p className="hero-note">{DISCLAIMER}</p>
          <div className="stats">
            <div className="stat">
              <b>{meta.total.toLocaleString()}</b>
              <span>药品说明书</span>
            </div>
            <div className="stat">
              <b>{meta.wiki.toLocaleString()}</b>
              <span>疾病条目</span>
            </div>
            <div className="stat">
              <b>{meta.generic.toLocaleString()}</b>
              <span>药品通用名</span>
            </div>
            <div className="stat">
              <b>{meta.wikiDepts.length}</b>
              <span>疾病科室</span>
            </div>
          </div>
        </section>
        <div className="home-grid">
          <Link className="home-card" href="/search">
            <div className="kicker">药品</div>
            <h2>说明书查询</h2>
            <p className="muted">按通用名、商品名、批准文号、拼音或企业查找，点开后按需加载正文。</p>
          </Link>
          <Link className="home-card" href="/wiki">
            <div className="kicker">疾病</div>
            <h2>疾病百科</h2>
            <p className="muted">按病名、症状、科室查找。条目中的药品会链到说明书，并发症可跳到其他疾病。</p>
          </Link>
        </div>
        <HomeLists />
      </main>
    </div>
  );
}
