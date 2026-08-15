import {
  getAliases,
  getCatalog,
  getDiseaseIndex,
  getGenericIndex,
  getSearchAccel,
  getWikiPack,
  itemFrom,
} from "@/lib/data";
import { candidateIndices } from "@/lib/search-accel";
import type { DrugRow, WikiRow } from "@/lib/types";

const SUFFIXES = ["综合征", "症候群", "综合症", "疾病", "病", "症"];

export function tokenize(q: string) {
  return q
    .replace(/[，,]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeDisease(name: string) {
  let n = (name || "").trim();
  for (const s of SUFFIXES) {
    if (n.endsWith(s) && n.length - s.length >= 2) {
      n = n.slice(0, n.length - s.length);
      break;
    }
  }
  return n;
}

export async function resolveWiki(name: string) {
  if (!name) return "";
  const alias = await getAliases();
  const accel = await getSearchAccel();
  if (alias[name]) return alias[name];
  if (accel.wikiByName.has(name)) return name;
  const n = normalizeDisease(name);
  if (n && alias[n]) return alias[n];
  if (n && accel.wikiByName.has(n)) return n;
  return "";
}

/** Ranked near-matches when exact wiki resolve fails. */
export async function fuzzyWikiNames(name: string, limit = 8) {
  const q = (name || "").trim();
  if (!q) return [] as string[];
  const accel = await getSearchAccel();
  const n = normalizeDisease(q);
  const scored: { name: string; score: number }[] = [];
  const keys = [q.slice(0, 1).toLowerCase(), q.length >= 2 ? q.slice(0, 2).toLowerCase() : ""].filter(Boolean);
  const pool = new Set<string>();
  for (const k of keys) {
    for (const w of accel.wikiPrefix.get(k) || []) pool.add(w);
  }
  // Also scan a bounded fallback if prefix pool is tiny
  const list = pool.size >= 8 ? [...pool] : accel.wikiNames;
  for (const w of list) {
    let score = 0;
    if (w === q) score = 100;
    else if (w.startsWith(q) || q.startsWith(w)) score = 80;
    else if (w.includes(q) || (q.length >= 2 && q.includes(w))) score = 55;
    else if (n && (w.includes(n) || n.includes(w))) score = 40;
    if (score) scored.push({ name: w, score });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "zh"));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of scored) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    out.push(s.name);
    if (out.length >= limit) break;
  }
  return out;
}

export async function diseaseMatchKeys(name: string) {
  const keys = new Set<string>();
  if (name && name.length >= 2) keys.add(name);
  const canon = await resolveWiki(name);
  if (canon) keys.add(canon);
  const alias = await getAliases();
  for (const [src, dst] of Object.entries(alias)) {
    if (dst === canon || src === name) keys.add(src);
  }
  return [...keys];
}

function blob(p: DrugRow) {
  return `${p[1]} ${p[2]} ${p[3]} ${p[4]} ${p[7]} ${p[9]}`.toLowerCase();
}

function wikiBlob(p: WikiRow) {
  return `${p[1]} ${p[2]} ${p[3]} ${p[4]} ${p[6]}`.toLowerCase();
}

function matchRow(p: DrugRow, tokens: string[], klass: string, nature: string) {
  if (klass && p[5] !== klass) return false;
  if (nature && p[6] !== nature) return false;
  if (!tokens.length) return true;
  const b = blob(p);
  return tokens.every((t) => b.includes(t));
}

export async function searchDrugs(q: string, klass = "", nature = "", page = 1, size = 20) {
  page = Math.max(1, page | 0);
  size = Math.min(50, Math.max(1, size | 0));
  const tokens = tokenize(q);
  const cat = await getCatalog();
  const accel = await getSearchAccel();
  const hits: DrugRow[] = [];

  // Exact generic via index
  if (tokens.length === 1 && !klass && !nature) {
    const gids = (await getGenericIndex())[q.trim()];
    if (gids?.length) {
      for (const id of gids) {
        const p = accel.byId.get(id);
        if (p) hits.push(p);
      }
    }
  }

  if (!hits.length) {
    const cand = candidateIndices(accel, tokens, cat.length);
    if (cand) {
      for (const idx of cand) {
        const p = cat[idx];
        if (matchRow(p, tokens, klass, nature)) hits.push(p);
      }
    } else {
      for (let i = 0; i < cat.length; i++) {
        if (matchRow(cat[i], tokens, klass, nature)) hits.push(cat[i]);
      }
    }
  }

  const grouped = Boolean(q) && !q.startsWith("国药准字") && !q.startsWith("注册证号");
  if (grouped) {
    const map = new Map<
      string,
      { generic_name: string; count: number; manufacturers: Set<string>; classification: string; nature: string; items: ReturnType<typeof itemFrom>[] }
    >();
    for (const p of hits) {
      const gname = p[1] || p[4] || String(p[0]);
      let g = map.get(gname);
      if (!g) {
        g = { generic_name: gname, count: 0, manufacturers: new Set(), classification: p[5], nature: p[6], items: [] };
        map.set(gname, g);
      }
      g.count += 1;
      if (p[7]) g.manufacturers.add(p[7]);
      if (g.items.length < 6) g.items.push(itemFrom(p));
    }
    const first = tokens[0] || q;
    const groups = [...map.values()].sort((a, b) => {
      const rank = (n: string) => (n === q ? 0 : n.startsWith(first) ? 1 : n.includes(first) ? 2 : 3);
      const d = rank(a.generic_name) - rank(b.generic_name);
      return d || b.count - a.count;
    });
    return {
      mode: "groups" as const,
      q,
      page,
      size,
      total: groups.length,
      groups: groups.slice((page - 1) * size, page * size).map((g) => ({
        generic_name: g.generic_name,
        count: g.count,
        manufacturers: g.manufacturers.size,
        classification: g.classification,
        nature: g.nature,
        items: g.items,
      })),
    };
  }
  return {
    mode: "items" as const,
    q,
    page,
    size,
    total: hits.length,
    items: hits.slice((page - 1) * size, page * size).map(itemFrom),
  };
}

export async function searchWiki(q: string, dept = "", page = 1, size = 20) {
  page = Math.max(1, page | 0);
  size = Math.min(50, Math.max(1, size | 0));
  const tokens = tokenize(q);
  const { rows } = await getWikiPack();
  const accel = await getSearchAccel();
  let pool: WikiRow[] = rows;
  if (tokens.length === 1 && !dept) {
    const names = new Set<string>();
    for (const k of [tokens[0].slice(0, 1), tokens[0].slice(0, 2)].filter((x) => x.length)) {
      for (const n of accel.wikiPrefix.get(k) || []) names.add(n);
    }
    if (names.size && names.size < rows.length * 0.5) {
      pool = [...names].map((n) => accel.wikiByName.get(n)!).filter(Boolean);
    }
  }
  const hits: WikiRow[] = [];
  for (const p of pool) {
    if (dept && p[2] !== dept) continue;
    if (tokens.length && !tokens.every((t) => wikiBlob(p).includes(t))) continue;
    hits.push(p);
  }
  const first = tokens[0] || q;
  hits.sort((a, b) => {
    const rank = (n: string) => (n === q ? 0 : n.startsWith(first) ? 1 : 2);
    return rank(a[1]) - rank(b[1]) || a[1].localeCompare(b[1], "zh");
  });
  return { q, dept, page, size, total: hits.length, items: hits.slice((page - 1) * size, page * size) };
}

export async function queryGeneric(name: string, page = 1, size = 40) {
  page = Math.max(1, page | 0);
  size = Math.min(80, Math.max(1, size | 0));
  const index = await getGenericIndex();
  const accel = await getSearchAccel();
  let rows = (index[name] || []).map((id) => accel.byId.get(id)).filter((p): p is DrugRow => Boolean(p));
  if (!rows.length || (rows.length && rows[0][1] !== name)) {
    rows = (await getCatalog()).filter((p) => p[1] === name);
  }
  if (!rows.length) {
    rows = (await getCatalog()).filter((p) => (p[1] && p[1].includes(name)) || p[2] === name);
  }
  const brands = [...new Set(rows.map((p) => p[2]).filter(Boolean))].slice(0, 30);
  return {
    generic_name: rows[0]?.[1] || name,
    total: rows.length,
    page,
    size,
    brands,
    items: rows.slice((page - 1) * size, page * size).map(itemFrom),
  };
}

export async function queryDisease(name: string, page = 1, size = 20) {
  page = Math.max(1, page | 0);
  size = Math.min(50, Math.max(1, size | 0));
  const keys = await diseaseMatchKeys(name);
  const index = await getDiseaseIndex();
  const idSet = new Set<number>();
  for (const k of keys) {
    for (const id of index[k] || []) idSet.add(id);
  }
  const accel = await getSearchAccel();
  const map = new Map<string, { generic_name: string; count: number; classification: string; nature: string; items: ReturnType<typeof itemFrom>[] }>();
  for (const id of idSet) {
    const p = accel.byId.get(id);
    if (!p) continue;
    const gname = p[1];
    let g = map.get(gname);
    if (!g) {
      g = { generic_name: gname, count: 0, classification: p[5], nature: p[6], items: [] };
      map.set(gname, g);
    }
    g.count += 1;
    if (g.items.length < 4) g.items.push(itemFrom(p));
  }
  const groups = [...map.values()].sort((a, b) => b.count - a.count);
  return {
    disease: name,
    total: groups.length,
    page,
    size,
    groups: groups.slice((page - 1) * size, page * size),
  };
}

export async function queryMfr(name: string, page = 1, size = 20) {
  page = Math.max(1, page | 0);
  size = Math.min(50, Math.max(1, size | 0));
  const rows = (await getCatalog()).filter((p) => p[7] === name);
  return {
    manufacturer: name,
    total: rows.length,
    page,
    size,
    items: rows.slice((page - 1) * size, page * size).map(itemFrom),
  };
}

export async function suggest(q: string, mode: "home" | "drug" | "wiki" = "home") {
  q = q.trim();
  if (!q) return [];
  const ql = q.toLowerCase();
  const out: { name: string; kind: string }[] = [];
  const seen = new Set<string>();
  const push = (name: string, kind: string) => {
    if (seen.has(name)) return out.length >= 12;
    seen.add(name);
    out.push({ name, kind });
    return out.length >= 12;
  };
  const accel = await getSearchAccel();
  const p1 = ql.slice(0, 1);
  const p2 = ql.length >= 2 ? ql.slice(0, 2) : "";

  if (mode !== "drug") {
    const names = new Set<string>([...(accel.wikiPrefix.get(p1) || []), ...(p2 ? accel.wikiPrefix.get(p2) || [] : [])]);
    const list = names.size ? [...names] : accel.wikiNames;
    for (const name of list) {
      if (name.startsWith(q) || name.toLowerCase().includes(ql)) {
        if (push(name, "疾病")) return out;
      }
    }
  }
  if (mode !== "wiki") {
    const gnames = new Set<string>([
      ...(accel.genericPrefix.get(p1) || []),
      ...(p2 ? accel.genericPrefix.get(p2) || [] : []),
    ]);
    for (const name of gnames.size ? gnames : accel.genericNames) {
      if (name.startsWith(q) || name.toLowerCase().includes(ql)) {
        if (push(name, "通用名")) return out;
      }
    }
    const brands = new Set<string>([...(accel.brandPrefix.get(p1) || []), ...(p2 ? accel.brandPrefix.get(p2) || [] : [])]);
    for (const name of brands.size ? brands : accel.brands) {
      if (name.startsWith(q) || name.toLowerCase().includes(ql)) {
        if (push(name, "商品名")) return out;
      }
    }
  }
  return out;
}
