"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr" }}>
      <main>
        <div className="panel-head">
          <h1>页面出错了</h1>
        </div>
        <p className="muted">{error.message || "未知错误"}</p>
        <button className="ghost" type="button" onClick={() => reset()} style={{ marginTop: 12 }}>
          重试
        </button>
      </main>
    </div>
  );
}
