import Link from "next/link";
import { Crumb, GroupCard } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { Toolbar } from "@/components/ClientBits";
import { LinkedBody } from "@/components/LinkedBody";
import { drugRefHref, getMeta, getWikiDetail, getWikiPack, wikiPath } from "@/lib/data";
import { fuzzyWikiNames, queryDisease, resolveWiki } from "@/lib/search";

export default async function WikiDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const meta = await getMeta();
  const wiki = await getWikiPack();
  const canon = (await resolveWiki(name)) || "";
  const id = canon ? wiki.rows.find((r) => r[1] === canon)?.[0] : undefined;

  if (!id) {
    const suggestions = await fuzzyWikiNames(name, 8);
    const drugHref = `/drugs-for/${encodeURIComponent(name)}`;
    return (
      <div className="layout">
        <Filters mode="wiki" classes={meta.classes} natures={meta.natures} depts={wiki.depts} />
        <main>
          <Crumb items={[{ href: "/", label: "首页" }, { href: "/wiki", label: "疾病" }, { label: name }]} />
          <div className="panel-head">
            <h1>未找到疾病「{name}」</h1>
          </div>
          <p className="muted">百科中没有完全匹配的词条。可查看近似病名，或按该名称检索相关药品说明书。</p>
          {suggestions.length ? (
            <section className="section">
              <h2>近似病名</h2>
              <div className="chips">
                {suggestions.map((s) => (
                  <Link className="tag" key={s} href={wikiPath(s)}>
                    {s}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <p style={{ marginTop: 18 }}>
            <Link className="ghost" href={drugHref}>
              按「{name}」查找相关药品
            </Link>
            <Link className="ghost" href={`/wiki/search?q=${encodeURIComponent(name)}`} style={{ marginLeft: 10 }}>
              在疾病中搜索
            </Link>
          </p>
        </main>
      </div>
    );
  }

  const d = await getWikiDetail(id);
  if (!d) {
    const suggestions = await fuzzyWikiNames(name, 8);
    return (
      <div className="layout">
        <Filters mode="wiki" classes={meta.classes} natures={meta.natures} depts={wiki.depts} />
        <main>
          <div className="empty">词条数据缺失。{suggestions[0] ? `试试「${suggestions[0]}」` : ""}</div>
        </main>
      </div>
    );
  }

  const related = await queryDisease(d.name, 1, 8);
  const acompany = await Promise.all(
    d.acompany.map(async (x) => ({ label: x, href: wikiPath((await resolveWiki(x)) || x) }))
  );
  const sectionEntries = [
    ["desc", "概述"],
    ["cause", "病因"],
    ["prevent", "预防"],
  ].filter(([k]) => d.sections[k]);
  return (
    <div className="layout">
      <Filters mode="wiki" classes={meta.classes} natures={meta.natures} depts={wiki.depts} />
      <main>
        <article className="insert">
          <div className="insert-grid">
            <nav className="toc no-print">
              <div className="kicker">章节</div>
              {sectionEntries.map(([k, label]) => (
                <a key={k} href={`#sec-${k}`}>
                  {label}
                </a>
              ))}
              {related.total ? <a href="#sec-drugs">相关药品</a> : null}
            </nav>
            <div className="insert-body">
              <Crumb items={[{ href: "/", label: "首页" }, { href: "/wiki", label: "疾病" }, { label: d.name }]} />
              <Toolbar item={{ t: "wiki", name: d.name, title: d.name, sub: d.dept || "疾病百科" }} />
              <div className="kicker">
                {d.dept || "疾病百科"}
                {d.sub && d.sub !== d.dept ? ` · ${d.sub}` : ""}
              </div>
              <h1>{d.name}</h1>
              <dl className="facts">
                <dt>传染</dt>
                <dd>{d.get_way || "—"}</dd>
                <dt>易感</dt>
                <dd>{d.easy_get || d.get_prob || "—"}</dd>
                <dt>医保</dt>
                <dd>{d.yibao_status || "—"}</dd>
                <dt>治疗</dt>
                <dd>{d.cure_way.join("、") || "—"}</dd>
                <dt>周期</dt>
                <dd>{d.cure_lasttime || "—"}</dd>
                <dt>治愈率</dt>
                <dd>{d.cured_prob || "—"}</dd>
                <dt>费用</dt>
                <dd>{d.cost_money || "—"}</dd>
                <dt>症状</dt>
                <dd className="chips">
                  {d.symptom.length
                    ? d.symptom.map((x) => (
                        <Link className="tag" key={x} href={`/wiki/search?q=${encodeURIComponent(x)}`}>
                          {x}
                        </Link>
                      ))
                    : "—"}
                </dd>
                <dt>检查</dt>
                <dd className="chips">
                  {d.check.length
                    ? d.check.map((x) => (
                        <span className="pill" key={x}>
                          {x}
                        </span>
                      ))
                    : "—"}
                </dd>
                <dt>并发症</dt>
                <dd className="chips">
                  {acompany.length
                    ? acompany.map((x) => (
                        <Link className="tag" key={x.label} href={x.href}>
                          {x.label}
                        </Link>
                      ))
                    : "—"}
                </dd>
                <dt>常用药</dt>
                <dd className="chips">
                  {d.common_drug.map((x) => (
                    <Link className="tag" key={x.label} href={drugRefHref(x.kind, x.target)}>
                      {x.label}
                    </Link>
                  ))}
                </dd>
                <dt>推荐药</dt>
                <dd className="chips">
                  {d.recommand_drug.map((x) => (
                    <Link className="tag" key={x.label} href={drugRefHref(x.kind, x.target)}>
                      {x.label}
                    </Link>
                  ))}
                </dd>
                <dt>药品明细</dt>
                <dd className="chips">
                  {d.drug_detail.map((x) => (
                    <Link className="tag" key={x.label} href={drugRefHref(x.kind, x.target)}>
                      {x.label}
                    </Link>
                  ))}
                </dd>
              </dl>
              {sectionEntries.map(([k, label]) => (
                <section className="section" id={`sec-${k}`} key={k}>
                  <h2>{label}</h2>
                  <LinkedBody text={d.sections[k]} />
                </section>
              ))}
              {(d.do_eat.length || d.not_eat.length || d.recommand_eat.length) > 0 ? (
                <section className="section">
                  <h2>饮食建议</h2>
                  <div className="food-grid">
                    {d.do_eat.length ? (
                      <div className="food-col">
                        <h3>宜吃</h3>
                        <div className="chips">
                          {d.do_eat.map((x) => (
                            <span className="pill" key={x}>
                              {x}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {d.recommand_eat.length ? (
                      <div className="food-col">
                        <h3>推荐食谱</h3>
                        <div className="chips">
                          {d.recommand_eat.map((x) => (
                            <span className="pill" key={x}>
                              {x}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {d.not_eat.length ? (
                      <div className="food-col bad">
                        <h3>不宜吃</h3>
                        <div className="chips">
                          {d.not_eat.map((x) => (
                            <span className="pill" key={x}>
                              {x}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
              {related.total > 0 ? (
                <section className="section" id="sec-drugs">
                  <h2>说明书中的相关药品</h2>
                  {related.groups.map((g) => (
                    <GroupCard key={g.generic_name} g={g} />
                  ))}
                  <Link className="ghost" href={`/drugs-for/${encodeURIComponent(d.name)}`}>
                    查看全部 {related.total} 个通用名
                  </Link>
                </section>
              ) : null}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
