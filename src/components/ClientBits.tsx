"use client";

import { useEffect, useState } from "react";

type Item = { t: string; id?: number; name?: string; title: string; sub?: string };
const LS_RECENT = "medref.recent.v1";
const LS_FAV = "medref.fav.v1";

function recKey(item: Item) {
  return item.t + ":" + (item.id || item.name || "");
}

function read(key: string): Item[] {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(key: string, arr: Item[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export function pushRecent(item: Item) {
  const next = [item, ...read(LS_RECENT).filter((x) => recKey(x) !== recKey(item))].slice(0, 24);
  write(LS_RECENT, next);
}

export function Toolbar({ item }: { item: Item }) {
  const [starred, setStarred] = useState(false);
  useEffect(() => {
    setStarred(read(LS_FAV).some((x) => recKey(x) === recKey(item)));
    pushRecent(item);
  }, [item]);
  return (
    <div className="toolbar no-print">
      <button type="button" className="ghost" onClick={() => window.print()}>
        打印
      </button>
      <button
        type="button"
        className="ghost"
        onClick={() => {
          const cur = read(LS_FAV);
          const exists = cur.some((x) => recKey(x) === recKey(item));
          write(LS_FAV, exists ? cur.filter((x) => recKey(x) !== recKey(item)) : [item, ...cur].slice(0, 80));
          setStarred(!exists);
        }}
      >
        {starred ? "取消收藏" : "收藏"}
      </button>
    </div>
  );
}

export function HomeLists() {
  const [recent, setRecent] = useState<Item[]>([]);
  const [favs, setFavs] = useState<Item[]>([]);
  useEffect(() => {
    setRecent(read(LS_RECENT));
    setFavs(read(LS_FAV));
  }, []);
  function href(item: Item) {
    if (item.t === "drug") return `/drug/${item.id}`;
    if (item.t === "wiki") return `/wiki/${encodeURIComponent(item.name || "")}`;
    if (item.t === "generic") return `/generic/${encodeURIComponent(item.name || "")}`;
    return "/";
  }
  return (
    <>
      {favs.length > 0 && (
        <>
          <div className="panel-head">
            <h2>收藏</h2>
            <div className="muted">{favs.length} 条</div>
          </div>
          <div className="home-grid rec-grid">
            {favs.slice(0, 12).map((item) => (
              <a className="card" key={recKey(item)} href={href(item)}>
                <h3>{item.title}</h3>
                <div className="mini">{item.sub || ""}</div>
              </a>
            ))}
          </div>
        </>
      )}
      {recent.length > 0 && (
        <>
          <div className="panel-head">
            <h2>最近看过</h2>
            <div className="muted">保存在本机浏览器</div>
          </div>
          <div className="home-grid rec-grid">
            {recent.slice(0, 8).map((item) => (
              <a className="card" key={recKey(item)} href={href(item)}>
                <h3>{item.title}</h3>
                <div className="mini">{item.sub || ""}</div>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
