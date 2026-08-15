import Link from "next/link";
import type { DrugItem } from "@/lib/types";
import { genericPath } from "@/lib/data";

export function Pill({ nature, classification, extra }: { nature?: string; classification?: string; extra?: string }) {
  return (
    <div className="pills">
      {classification ? <span className="pill">{classification}</span> : null}
      {nature ? <span className={`pill ${/处方|麻醉|精神/.test(nature) ? "rx" : "warn"}`}>{nature}</span> : null}
      {extra ? <span className="pill">{extra}</span> : null}
    </div>
  );
}

export function DrugCard({ it }: { it: DrugItem }) {
  return (
    <Link className="card" href={`/drug/${it.id}`}>
      <h3>{it.generic_name}</h3>
      <div className="meta-row">
        {it.brand_name && it.brand_name !== it.generic_name ? `商品名 ${it.brand_name} · ` : ""}
        {it.approval_no}
      </div>
      <div className="mini">
        {it.manufacturer} · {it.spec}
      </div>
      <Pill nature={it.nature} classification={it.classification} />
    </Link>
  );
}

export function GroupCard({
  g,
}: {
  g: { generic_name: string; count: number; manufacturers?: number; classification?: string; nature?: string; items?: DrugItem[] };
}) {
  const sample = g.items?.[0];
  return (
    <Link className="group" href={genericPath(g.generic_name)}>
      <h3>{g.generic_name}</h3>
      <div className="meta-row">
        {sample?.spec || ""} {sample?.manufacturer || ""}
      </div>
      <Pill
        nature={g.nature}
        classification={g.classification}
        extra={`${g.count} 个批准文号${g.manufacturers ? ` · ${g.manufacturers} 家企业` : ""}`}
      />
    </Link>
  );
}

export function WikiCard({
  p,
}: {
  p: [number, string, string, string, string, string, string];
}) {
  return (
    <Link className="card" href={`/wiki/${encodeURIComponent(p[1])}`}>
      <h3>{p[1]}</h3>
      <div className="meta-row">
        {p[2]}
        {p[3] && p[3] !== p[2] ? ` · ${p[3]}` : ""} · {p[4]}
      </div>
      <div className="mini">{p[6]}</div>
      <div className="pills">
        {p[2] ? <span className="pill">{p[2]}</span> : null}
        {p[5] ? <span className="pill">{`医保 ${p[5]}`}</span> : null}
      </div>
    </Link>
  );
}

export function Pager({
  page,
  size,
  total,
  hrefFor,
}: {
  page: number;
  size: number;
  total: number;
  hrefFor: (p: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return (
    <div className="pager">
      {page > 1 ? (
        <Link className="ghost" href={hrefFor(page - 1)}>
          上一页
        </Link>
      ) : null}
      <span className="muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link className="ghost" href={hrefFor(page + 1)}>
          下一页
        </Link>
      ) : null}
    </div>
  );
}

export function Crumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <div className="crumb no-print">
      {items.map((x, i) => (
        <span key={x.label}>
          {i > 0 ? " / " : null}
          {i === items.length - 1 || !x.href ? <span>{x.label}</span> : <Link href={x.href}>{x.label}</Link>}
        </span>
      ))}
    </div>
  );
}
