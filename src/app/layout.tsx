import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { dataHealth, getMeta } from "@/lib/data";
import { DISCLAIMER } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "药品 · 疾病查询",
  description: DISCLAIMER,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let subtitle = "在线检索";
  const health = await dataHealth();
  if (health.ok) {
    try {
      const meta = await getMeta();
      subtitle = `药品 ${meta.total.toLocaleString()} · 疾病 ${meta.wiki.toLocaleString()}`;
    } catch {
      subtitle = "数据异常";
    }
  } else {
    subtitle = "数据未就绪";
  }

  return (
    <html lang="zh-CN">
      <body>
        {!health.ok ? (
          <div id="file-warning" role="alert">
            语料未就绪：{health.error}。请确认部署包含 public/data，或设置 DATA_BASE_URL 后重新部署。
          </div>
        ) : null}
        <Suspense fallback={<header className="top" />}>
          <Header subtitle={subtitle} />
        </Suspense>
        {children}
        <footer className="foot">{DISCLAIMER}</footer>
      </body>
    </html>
  );
}
