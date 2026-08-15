import type { DrugRow, WikiRow } from "@/lib/types";

export type SearchAccel = {
  byId: Map<number, DrugRow>;
  /** first 1–2 chars of generic/brand/pinyin/approval → catalog indices */
  drugPrefix: Map<string, number[]>;
  genericNames: string[];
  genericPrefix: Map<string, string[]>;
  brands: string[];
  brandPrefix: Map<string, string[]>;
  wikiByName: Map<string, WikiRow>;
  wikiNames: string[];
  wikiPrefix: Map<string, string[]>;
};

function pushMap(map: Map<string, number[]>, key: string, idx: number) {
  if (!key) return;
  const arr = map.get(key);
  if (arr) arr.push(idx);
  else map.set(key, [idx]);
}

function pushStr(map: Map<string, string[]>, key: string, value: string) {
  if (!key) return;
  const arr = map.get(key);
  if (arr) {
    if (!arr.includes(value)) arr.push(value);
  } else map.set(key, [value]);
}

function prefixKeys(text: string) {
  const t = text.toLowerCase();
  if (!t) return [] as string[];
  const keys = [t.slice(0, 1)];
  if (t.length >= 2) keys.push(t.slice(0, 2));
  return keys;
}

export function buildSearchAccel(
  catalog: DrugRow[],
  wikiRows: WikiRow[],
  genericIndex: Record<string, number[]>
): SearchAccel {
  const byId = new Map<number, DrugRow>();
  const drugPrefix = new Map<string, number[]>();
  const brandSet = new Set<string>();
  const brandPrefix = new Map<string, string[]>();

  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    byId.set(p[0], p);
    for (const field of [p[1], p[2], p[3], p[4]]) {
      for (const k of prefixKeys(field || "")) pushMap(drugPrefix, k, i);
    }
    if (p[2]) {
      brandSet.add(p[2]);
      for (const k of prefixKeys(p[2])) pushStr(brandPrefix, k, p[2]);
    }
  }

  const genericNames = Object.keys(genericIndex);
  const genericPrefix = new Map<string, string[]>();
  for (const name of genericNames) {
    for (const k of prefixKeys(name)) pushStr(genericPrefix, k, name);
  }

  const wikiByName = new Map<string, WikiRow>();
  const wikiNames: string[] = [];
  const wikiPrefix = new Map<string, string[]>();
  for (const row of wikiRows) {
    wikiByName.set(row[1], row);
    wikiNames.push(row[1]);
    for (const k of prefixKeys(row[1])) pushStr(wikiPrefix, k, row[1]);
  }

  return {
    byId,
    drugPrefix,
    genericNames,
    genericPrefix,
    brands: [...brandSet],
    brandPrefix,
    wikiByName,
    wikiNames,
    wikiPrefix,
  };
}

export function candidateIndices(accel: SearchAccel, tokens: string[], catalogLen: number) {
  if (!tokens.length) return null; // full scan
  let best: Set<number> | null = null;
  for (const token of tokens) {
    const keys = prefixKeys(token);
    const bucket = new Set<number>();
    for (const k of keys) {
      const arr = accel.drugPrefix.get(k);
      if (arr) for (const idx of arr) bucket.add(idx);
    }
    // Rare token / no index hit → fall back to full scan for safety
    if (!bucket.size) return null;
    if (!best) best = bucket;
    else {
      const next = new Set<number>();
      for (const idx of best) if (bucket.has(idx)) next.add(idx);
      best = next;
    }
    if (!best.size) return best;
  }
  // If candidate set is almost the whole catalog, full scan is similar cost
  if (best && best.size > catalogLen * 0.45) return null;
  return best;
}
