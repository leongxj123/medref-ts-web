export default function Loading() {
  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr" }}>
      <main>
        <div className="loadbar" aria-hidden />
        <p className="muted" style={{ marginTop: 16 }}>
          加载中…
        </p>
      </main>
    </div>
  );
}
