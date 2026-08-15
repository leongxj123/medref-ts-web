"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

function navMode(pathname: string): "home" | "drug" | "wiki" {
  if (pathname.startsWith("/wiki")) return "wiki";
  if (
    pathname.startsWith("/search") ||
    pathname.startsWith("/drug") ||
    pathname.startsWith("/generic") ||
    pathname.startsWith("/mfr") ||
    pathname.startsWith("/drugs-for")
  ) {
    return "drug";
  }
  return "home";
}

/** Current entity name from detail routes (wiki / generic / drugs-for / mfr). */
function detailLabel(pathname: string): string | null {
  const tryDecode = (raw: string) => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };
  if (pathname.startsWith("/wiki/search")) return null;
  const wiki = pathname.match(/^\/wiki\/([^/]+)$/);
  if (wiki) return tryDecode(wiki[1]);
  const generic = pathname.match(/^\/generic\/([^/]+)$/);
  if (generic) return tryDecode(generic[1]);
  const drugsFor = pathname.match(/^\/drugs-for\/([^/]+)$/);
  if (drugsFor) return tryDecode(drugsFor[1]);
  const mfr = pathname.match(/^\/mfr\/([^/]+)$/);
  if (mfr) return tryDecode(mfr[1]);
  return null;
}

export function Header({ subtitle }: { subtitle: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = navMode(pathname);
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [suggestErr, setSuggestErr] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchParams.has("q")) {
      const fromUrl = searchParams.get("q") || "";
      setQ(fromUrl);
      saveQ(fromUrl);
      setOpen(false);
      return;
    }
    const fromRoute = detailLabel(pathname);
    if (fromRoute) {
      // Detail title in the box only — do not overwrite the last keyword used for facet filters.
      setQ(fromRoute);
      setOpen(false);
      setHits([]);
      return;
    }
    // Search/browse URL without ?q= must match the empty keyword (avoid stale box text).
    if (pathname === "/wiki/search" || pathname === "/search" || pathname === "/all") {
      setQ("");
      setOpen(false);
      setHits([]);
      return;
    }
    setQ((prev) => prev || readSavedQ());
  }, [searchParams, pathname]);

  useEffect(() => {
    abortRef.current?.abort();
    const query = q.trim();
    if (!query) {
      setHits([]);
      setSuggestErr("");
      return;
    }
    // On a detail page whose label already fills the box, skip suggest fetch noise.
    if (detailLabel(pathname) === query) {
      setHits([]);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/suggest?q=${encodeURIComponent(query)}&mode=${mode}`, {
          signal: ac.signal,
        });
        if (res.status === 401) {
          setSuggestErr("登录已失效");
          return;
        }
        if (!res.ok) {
          setSuggestErr("联想失败");
          return;
        }
        const data = await res.json();
        setHits(data.items || []);
        setIdx(-1);
        setSuggestErr("");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSuggestErr("联想失败");
      }
    }, 80);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q, mode, pathname]);

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
    updateQ(hit.name);
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
        {suggestErr ? <div className="suggest-err muted">{suggestErr}</div> : null}
      </form>
      {pathname !== "/login" ? (
        <form action="/api/auth/logout" method="post" className="logout-form">
          <button type="submit" className="muted logout-btn">
            退出
          </button>
        </form>
      ) : null}
    </header>
  );
}
