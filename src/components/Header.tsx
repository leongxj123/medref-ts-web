"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Hit = { name: string; kind: string };

const Q_KEY = "medref_last_q";

function readSavedQ() {
  try {
    return sessionStorage.getItem(Q_KEY) || "";
  } catch {
    return "";
  }
}

function saveQ(value: string) {
  try {
    sessionStorage.setItem(Q_KEY, value);
  } catch {
    /* ignore */
  }
}

export function Header({ subtitle }: { subtitle: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = pathname.startsWith("/wiki")
    ? "wiki"
    : pathname.startsWith("/search") ||
        pathname.startsWith("/drug") ||
        pathname.startsWith("/generic") ||
        pathname.startsWith("/mfr")
      ? "drug"
      : "home";
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);

  useEffect(() => {
    // Only sync from URL when the page actually carries ?q= (search results).
    // Detail pages have no q — keep what the user typed instead of wiping the box.
    if (searchParams.has("q")) {
      const fromUrl = searchParams.get("q") || "";
      setQ(fromUrl);
      saveQ(fromUrl);
      return;
    }
    setQ((prev) => prev || readSavedQ());
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) {
        setHits([]);
        return;
      }
      const res = await fetch(`/api/v1/suggest?q=${encodeURIComponent(query)}&mode=${mode}`);
      if (!res.ok) return;
      const data = await res.json();
      setHits(data.items || []);
      setIdx(-1);
    }, 80);
    return () => clearTimeout(t);
  }, [q, mode]);

  function updateQ(value: string) {
    setQ(value);
    saveQ(value);
  }

  const placeholder = useMemo(
    () =>
      mode === "wiki"
        ? "病名、症状、科室…"
        : mode === "drug"
          ? "通用名、商品名、批准文号、拼音、企业…"
          : "药品名、疾病名、症状、批准文号…",
    [mode]
  );

  function goSearch(value = q) {
    const query = value.trim();
    updateQ(query);
    setOpen(false);
    if (mode === "wiki") router.push(`/wiki/search?q=${encodeURIComponent(query)}`);
    else if (mode === "home") router.push(query ? `/all?q=${encodeURIComponent(query)}` : "/");
    else router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (idx >= 0 && hits[idx]) pick(hits[idx]);
    else goSearch();
  }

  function pick(hit: Hit) {
    setOpen(false);
    saveQ(q);
    if (hit.kind === "疾病") router.push(`/wiki/${encodeURIComponent(hit.name)}`);
    else if (hit.kind === "通用名") router.push(`/generic/${encodeURIComponent(hit.name)}`);
    else goSearch(hit.name);
  }

  return (
    <header className="top no-print">
      <Link className="brand" href="/">
        <span className="mark">医参</span>
        <span className="brand-text">
          <strong>药品 · 疾病查询</strong>
          <small>{subtitle}</small>
        </span>
      </Link>
      <nav className="modes">
        <Link href="/search" className={mode === "drug" ? "active" : ""}>
          药品
        </Link>
        <Link href="/wiki" className={mode === "wiki" ? "active" : ""}>
          疾病
        </Link>
      </nav>
      <form className="search" onSubmit={onSubmit} autoComplete="off">
        <input
          value={q}
          onChange={(e) => {
            updateQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => hits.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && hits.length) {
              e.preventDefault();
              setIdx((v) => Math.min(hits.length - 1, v + 1));
              setOpen(true);
            } else if (e.key === "ArrowUp" && hits.length) {
              e.preventDefault();
              setIdx((v) => Math.max(0, v - 1));
              setOpen(true);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
        />
        <button type="submit">查询</button>
        {open && hits.length > 0 && (
          <div className="suggest">
            {hits.map((hit, i) => (
              <button type="button" key={hit.kind + hit.name} className={i === idx ? "active" : ""} onMouseDown={() => pick(hit)}>
                <span>{hit.name}</span>
                <span className="kind">{hit.kind}</span>
              </button>
            ))}
          </div>
        )}
      </form>
      {pathname !== "/login" ? (
        <form action="/api/auth/logout" method="post" style={{ alignSelf: "end" }}>
          <button type="submit" className="muted" style={{ fontSize: 12, background: "none", border: 0, padding: 0, cursor: "pointer" }}>
            退出
          </button>
        </form>
      ) : null}
    </header>
  );
}
