import Link from "next/link";
import { headers } from "next/headers";
import { buildOpenApi } from "@/lib/openapi";

export default async function DocsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;
  const spec = buildOpenApi(origin);
  const entries = Object.keys(spec.paths);

  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr" }}>
      <main>
        <div className="panel-head">
          <h1>LLM / 程序 API</h1>
          <div className="muted">
            <Link href="/api/v1/openapi">OpenAPI JSON</Link>
          </div>
        </div>
        <p className="muted">
          调用时在 Header 携带 <code>Authorization: Bearer $API_KEY</code>（或已登录会话 Cookie）。数据仅供学习参考。
        </p>
        <section className="section">
          <h2>接口一览</h2>
          <ul>
            {entries.map((p) => (
              <li key={p}>
                <code>{p}</code>
                {" — "}
                {(spec.paths as Record<string, { get?: { summary?: string } }>)[p]?.get?.summary || ""}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
