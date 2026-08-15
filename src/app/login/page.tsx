export const dynamic = "force-dynamic";

function envPresent(name: string) {
  return Boolean(process.env[name]?.trim());
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const checks = {
    AUTH_USERNAME: envPresent("AUTH_USERNAME"),
    AUTH_PASSWORD: envPresent("AUTH_PASSWORD"),
    AUTH_SECRET: envPresent("AUTH_SECRET") && (process.env.AUTH_SECRET?.trim().length || 0) >= 16,
  };
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/";

  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr", maxWidth: 480 }}>
      <main>
        <section className="hero">
          <h1>登录</h1>
          <p className="hero-note">账号密码在 Vercel 环境变量中配置，不写进代码。登录后会话保留约 14 天。</p>
          {missing.length ? (
            <p className="empty">
              当前部署读不到：{missing.join("、")}
              <br />
              请在 Vercel → Settings → Environment Variables 勾选 Production，保存后 Redeploy（关闭 Build Cache）。
            </p>
          ) : null}
          {sp.error === "1" ? <p className="empty">账号或密码不正确。</p> : null}
          {sp.error === "env" ? <p className="empty">环境变量未生效，请重新部署。</p> : null}
          <form action="/api/auth/login" method="post" style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <input type="hidden" name="next" value={next} />
            <input name="username" placeholder="账号" autoComplete="username" required disabled={missing.length > 0} />
            <input
              name="password"
              type="password"
              placeholder="密码"
              autoComplete="current-password"
              required
              disabled={missing.length > 0}
            />
            <button
              className="ghost"
              type="submit"
              style={{ background: "var(--accent)", color: "#fff", border: 0 }}
              disabled={missing.length > 0}
            >
              进入
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
