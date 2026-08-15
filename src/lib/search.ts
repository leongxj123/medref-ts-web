import { getAliases, getCatalog, getDiseaseIndex, getGenericIndex, getWikiPack, itemFrom } from "@/lib/data";
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
  const wiki = await getWikiPack();
  const has = new Set(wiki.rows.map((r) => r[1]));
  if (alias[name]) return alias[name];
  if (has.has(name)) return name;
  const n = normalizeDisease(name);
  if (n && alias[n]) return alias[n];
  if (n && has.has(n)) return n;
  return "";
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
  const hits: DrugRow[] = [];
  for (let i = 0; i < cat.length; i++) {
    if (matchRow(cat[i], tokens, klass, nature)) hits.push(cat[i]);
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
  const hits: WikiRow[] = [];
  for (const p of rows) {
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
  const cat = await getCatalog();
  const byId = new Map(cat.map((p) => [p[0], p]));
  let rows = (index[name] || []).map((id) => byId.get(id)).filter((p): p is DrugRow => Boolean(p));
  if (!rows.length || (rows.length && rows[0][1] !== name)) {
    rows = cat.filter((p) => p[1] === name);
  }
  if (!rows.length) {
    rows = cat.filter((p) => (p[1] && p[1].includes(name)) || p[2] === name);
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
  const cat = await getCatalog();
  const byId = new Map(cat.map((p) => [p[0], p] as const));
  const map = new Map<string, { generic_name: string; count: number; classification: string; nature: string; items: ReturnType<typeof itemFrom>[] }>();
  for (const id of idSet) {
    const p = byId.get(id);
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
  if (mode !== "drug") {
    const { rows } = await getWikiPack();
    for (const p of rows) {
      const name = p[1];
      if (name.startsWith(q) || name.toLowerCase().includes(ql)) {
        if (push(name, "疾病")) return out;
      }
    }
  }
  if (mode !== "wiki") {
    const index = await getGenericIndex();
    for (const name of Object.keys(index)) {
      if (name.startsWith(q) || name.toLowerCase().includes(ql)) {
        if (push(name, "通用名")) return out;
      }
    }
    const cat = await getCatalog();
    const bset = new Set<string>();
    for (const p of cat) {
      if (p[2] && !bset.has(p[2])) {
        bset.add(p[2]);
        if (p[2].startsWith(q) || p[2].toLowerCase().includes(ql)) {
          if (push(p[2], "商品名")) return out;
        }
      }
    }
  }
  return out;
}
