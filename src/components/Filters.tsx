import Link from "next/link";

export function Filters({
  mode,
  classes,
  natures,
  depts,
  klass,
  nature,
  dept,
}: {
  mode: "wiki" | "drug" | "home";
  classes: string[];
  natures: string[];
  depts: string[];
  klass?: string;
  nature?: string;
  dept?: string;
  /** @deprecated Chips browse by facet only; keyword stays in the top search box. */
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
    // 点科室 = 浏览该科全部条目，不叠加当前检索词
    const href = (d: string) => {
      const p = new URLSearchParams();
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
        <p className="hint">点击科室查看该科全部疾病；顶部搜索框用于关键词检索。</p>
      </aside>
    );
  }
  // 点分类/性质 = 浏览该维度全部，不叠加当前检索词
  const href = (c: string, n: string) => {
    const p = new URLSearchParams();
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
      <p className="hint">点击分类或性质查看该条件下的全部药品；关键词请用顶部搜索。</p>
    </aside>
  );
}
