import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumb, DrugCard } from "@/components/Cards";
import { Filters } from "@/components/Filters";
import { Toolbar } from "@/components/ClientBits";
import { getCatalog, getDrugDetail, getMeta, itemFrom, wikiPath } from "@/lib/data";
import { resolveWiki } from "@/lib/search";
import { SECTION_LABELS, SECTION_TONE } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DrugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!id) notFound();
  const d = await getDrugDetail(id);
  if (!d) notFound();
  const meta = await getMeta();
  const cat = await getCatalog();
  const siblings = cat.filter((p) => p[1] === d.generic_name && p[0] !== id).slice(0, 8).map(itemFrom);
  const siblingCount = cat.filter((p) => p[1] === d.generic_name).length;
  const sections = Object.keys(SECTION_LABELS).filter((k) => d.sections[k]);
  const diseaseLinks = await Promise.all(
    d.diseases.map(async (x) => ({ label: x, href: wikiPath((await resolveWiki(x)) || x) }))
  );
  return (
    <div className="layout">
      <Filters mode="drug" classes={meta.classes} natures={meta.natures} depts={meta.wikiDepts} />
      <main>
        <article className="insert">
          <div className="insert-grid">
            <nav className="toc no-print">
              <div className="kicker">章节</div>
              {sections.map((k) => (
                <a key={k} href={`#sec-${k}`}>
                  {SECTION_LABELS[k]}
                </a>
              ))}
            </nav>
            <div className="insert-body">
              <Crumb
                items={[
                  { href: "/", label: "首页" },
                  { href: "/search", label: "药品" },
                  { label: d.generic_name || d.title },
                ]}
              />
              <Toolbar
                item={{
                  t: "drug",
                  id: d.id,
                  title: d.generic_name || d.title,
                  sub: d.approval_no || d.brand_name,
                }}
              />
              <div className="kicker">{d.classification || "药品说明书"}</div>
              <h1>{d.generic_name || d.title}</h1>
              <div className="sub">{d.brand_name && d.brand_name !== d.generic_name ? `商品名 ${d.brand_name}` : ""}</div>
              <dl className="info-grid">
                <dt>批准文号</dt>
                <dd>{d.approval_no || "—"}</dd>
                <dt>汉语拼音</dt>
                <dd>{d.pinyin || "—"}</dd>
                <dt>规格</dt>
                <dd>{d.spec || "—"}</dd>
                <dt>药品性质</dt>
                <dd>{d.nature || "—"}</dd>
                <dt>生产企业</dt>
                <dd>
                  {d.manufacturer ? (
                    <Link href={`/mfr/${encodeURIComponent(d.manufacturer)}`}>{d.manufacturer}</Link>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>相关疾病</dt>
                <dd className="chips">
                  {diseaseLinks.length
                    ? diseaseLinks.map((x) => (
                        <Link className="tag" key={x.label} href={x.href}>
                          {x.label}
                        </Link>
                      ))
                    : "—"}
                </dd>
              </dl>
              {sections.map((k) => (
                <section className={`section ${SECTION_TONE[k] || ""}`} id={`sec-${k}`} key={k}>
                  <h2>{SECTION_LABELS[k]}</h2>
                  <div className="body" style={{ whiteSpace: "pre-wrap" }}>
                    {d.sections[k]}
                  </div>
                </section>
              ))}
              {siblingCount > 1 ? (
                <div className="side-box">
                  <h3>同通用名还有 {siblingCount - 1} 个品种</h3>
                  {siblings.map((it) => (
                    <DrugCard key={it.id} it={it} />
                  ))}
                  <Link className="ghost" href={`/generic/${encodeURIComponent(d.generic_name)}`}>
                    查看全部
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
