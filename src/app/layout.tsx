import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { getMeta } from "@/lib/data";
import { DISCLAIMER } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "药品 · 疾病查询",
  description: DISCLAIMER,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let subtitle = "在线检索";
  try {
    const meta = await getMeta();
    subtitle = `药品 ${meta.total.toLocaleString()} · 疾病 ${meta.wiki.toLocaleString()}`;
  } catch {
    subtitle = "请先导出数据";
  }
  return (
    <html lang="zh-CN">
      <body>
        <Suspense fallback={<header className="top" />}>
          <Header subtitle={subtitle} />
        </Suspense>
        {children}
        <footer className="foot">{DISCLAIMER}</footer>
      </body>
    </html>
  );
}
