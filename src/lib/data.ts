import { gunzipSync } from "zlib";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { buildLinkTrie } from "@/lib/linkify";
import { buildSearchAccel, type SearchAccel } from "@/lib/search-accel";
import type { DrugDetail, DrugRow, Meta, WikiDetail, WikiRow } from "@/lib/types";

const mem = new Map<string, Promise<unknown>>();

function remember<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!mem.has(key)) mem.set(key, fn());
  return mem.get(key) as Promise<T>;
}

async function readBytes(rel: string): Promise<Buffer> {
  const local = path.join(process.cwd(), "public", "data", rel);
  try {
    if (existsSync(local)) return await readFile(local);
  } catch {
    /* fall through */
  }
  // Only explicit external/CDN base — never self-fetch /data (that path is auth-gated).
  const base = (process.env.DATA_BASE_URL || "").trim();
  if (!base) {
    throw new Error("缺少数据文件。请确认 public/data 已随部署上传，或设置 DATA_BASE_URL。");
  }
  const res = await fetch(`${base.replace(/\/$/, "")}/${rel.replace(/^\//, "")}`, {
    cache: "force-cache",
    headers: process.env.DATA_FETCH_TOKEN
      ? { Authorization: `Bearer ${process.env.DATA_FETCH_TOKEN}` }
      : undefined,
  });
  if (!res.ok) throw new Error(`无法读取数据 ${rel}（${res.status}）`);
  return Buffer.from(await res.arrayBuffer());
}

async function readJson<T>(rel: string): Promise<T> {
  return remember(rel, async () => {
    const buf = await readBytes(rel);
    const text = rel.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
    return JSON.parse(text) as T;
  });
}

export function getMeta() {
  return readJson<Meta>("meta.json");
}

export function getAliases() {
  return readJson<Record<string, string>>("aliases.json");
}

export async function getCatalog() {
  return readJson<DrugRow[]>("catalog.json.gz");
}

export async function getWikiPack() {
  return readJson<{ total: number; depts: string[]; shardSize: number; rows: WikiRow[] }>(
    "wiki-catalog.json.gz"
  );
}

export function getGenericIndex() {
  return readJson<Record<string, number[]>>("generic-index.json.gz");
}

export function getDiseaseIndex() {
  return readJson<Record<string, number[]>>("disease-index.json.gz");
}

export async function getSearchAccel(): Promise<SearchAccel> {
  return remember("search-accel", async () => {
    const [catalog, wiki, genericIndex] = await Promise.all([getCatalog(), getWikiPack(), getGenericIndex()]);
    return buildSearchAccel(catalog, wiki.rows, genericIndex);
  });
}

export async function getLinkTrie() {
  return remember("link-trie", async () => {
    const accel = await getSearchAccel();
    // Cap generics for trie size; prefer names length 2–24 to avoid noisy 1-char / ultra-long
    const generics = accel.genericNames.filter((n) => n.length >= 2 && n.length <= 24);
    const wikis = accel.wikiNames.filter((n) => n.length >= 2 && n.length <= 24);
    return buildLinkTrie(wikis, generics);
  });
}

export async function dataHealth() {
  try {
    const meta = await getMeta();
    return { ok: true as const, total: meta.total, wiki: meta.wiki, built_at: meta.built_at };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getDrugDetail(id: number) {
  const meta = await getMeta();
  const shard = Math.floor((id - 1) / (meta.drugShard || 100));
  const pack = await readJson<Record<string, DrugDetail>>(`d/${shard}.json.gz`);
  return pack[String(id)] || null;
}

export async function getWikiDetail(id: number) {
  const pack = await getWikiPack();
  const shard = Math.floor((id - 1) / (pack.shardSize || 50));
  const data = await readJson<Record<string, WikiDetail>>(`w/${shard}.json.gz`);
  return data[String(id)] || null;
}

export function itemFrom(p: DrugRow) {
  return {
    id: p[0],
    generic_name: p[1],
    brand_name: p[2],
    pinyin: p[3],
    approval_no: p[4],
    classification: p[5],
    nature: p[6],
    manufacturer: p[7],
    spec: p[8],
    diseases: p[9],
  };
}

export { encodePath, wikiPath, genericPath, drugRefHref } from "@/lib/paths";

