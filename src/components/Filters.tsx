import Link from "next/link";

export function Filters({
  mode,
  classes,
  natures,
  depts,
  klass,
  nature,
  dept,
  q,
}: {
  mode: "wiki" | "drug" | "home";
  classes: string[];
  natures: string[];
  depts: string[];
  klass?: string;
  nature?: string;
  dept?: string;
  q?: string;
}) {
  if (mode === "home") {
    return (
      <aside className="rail no-print">
        <p className="hint">药品与疾病可以互相跳转。点疾病名可看百科和相关说明书。</p>
      </aside>
    );
  }
  if (mode === "wiki") {
    const href = (d: string) => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (d) p.set("dept", d);
      return `/wiki/search?${p.toString()}`;
    };
    return (
      <aside className="rail no-print">
        <section>
          <h2>科室</h2>
          <div className="chips">
            <Link className={`chip ${dept ? "" : "active"}`} href={href("")}>
              全部
            </Link>
            {depts.map((d) => (
              <Link key={d} className={`chip ${dept === d ? "active" : ""}`} href={href(d)}>
                {d}
              </Link>
            ))}
          </div>
        </section>
        <p className="hint">并发症、推荐药品可点进对应条目或说明书。</p>
      </aside>
    );
  }
  const href = (c: string, n: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("class", c);
    if (n) p.set("nature", n);
    return `/search?${p.toString()}`;
  };
  return (
    <aside className="rail no-print">
      <section>
        <h2>药品分类</h2>
        <div className="chips">
          <Link className={`chip ${klass ? "" : "active"}`} href={href("", nature || "")}>
            全部
          </Link>
          {classes.map((c) => (
            <Link key={c} className={`chip ${klass === c ? "active" : ""}`} href={href(c, nature || "")}>
              {c}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>药品性质</h2>
        <div className="chips">
          <Link className={`chip ${nature ? "" : "active"}`} href={href(klass || "", "")}>
            全部
          </Link>
          {natures.map((n) => (
            <Link key={n} className={`chip ${nature === n ? "active" : ""}`} href={href(klass || "", n)}>
              {n}
            </Link>
          ))}
        </div>
      </section>
      <p className="hint">筛选会写在网址里，便于收藏和给 LLM 复用同一套查询。</p>
    </aside>
  );
}
