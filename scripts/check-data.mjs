import { existsSync } from "fs";
import path from "path";

const root = path.join(process.cwd(), "public", "data");
const required = ["meta.json", "aliases.json", "catalog.json.gz", "wiki-catalog.json.gz", "generic-index.json.gz", "disease-index.json.gz"];

const missing = required.filter((f) => !existsSync(path.join(root, f)));
if (missing.length) {
  console.error("[check-data] missing files in public/data:\n  - " + missing.join("\n  - "));
  console.error("Run: python ../export_web.py   (or set DATA_BASE_URL for CDN-hosted corpus)");
  // Allow build when DATA_BASE_URL is set for CDN-only deploys
  if (!process.env.DATA_BASE_URL?.trim()) {
    process.exit(1);
  }
  console.warn("[check-data] DATA_BASE_URL is set — continuing without local public/data.");
} else {
  console.log("[check-data] public/data OK");
}
