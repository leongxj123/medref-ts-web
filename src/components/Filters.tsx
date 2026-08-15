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
      const qs = p.toString();
      return qs ? `/wiki/search?${qs}` : "/wiki/search";
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
        <p className="hint">可在当前检索结果上按科室二次筛选；并发症、推荐药品可点进对应条目。</p>
      </aside>
    );
  }
  const href = (c: string, n: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("class", c);
    if (n) p.set("nature", n);
    const qs = p.toString();
    return qs ? `/search?${qs}` : "/search";
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
      <p className="hint">可在当前检索结果上按分类/性质二次筛选；筛选条件写在网址里便于收藏。</p>
    </aside>
  );
}
