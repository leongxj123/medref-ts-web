import { gunzipSync } from "zlib";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
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
    /* fall through to HTTP fetch */
  }
  const base =
    process.env.DATA_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");
  if (!base) {
    throw new Error("缺少数据文件。请确认 public/data 已随部署上传，或设置 DATA_BASE_URL。");
  }
  const res = await fetch(`${base.replace(/\/$/, "")}/data/${rel}`, {
    cache: "force-cache",
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

export function encodePath(name: string) {
  return encodeURIComponent(name || "");
}

export function wikiPath(name: string) {
  return `/wiki/${encodePath(name)}`;
}

export function genericPath(name: string) {
  return `/generic/${encodePath(name)}`;
}

export function drugRefHref(kind: string, target: string) {
  if (kind === "generic") return genericPath(target);
  return `/search?q=${encodePath(target)}`;
}
