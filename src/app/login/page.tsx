import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, checkPassword, signSession } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  const user = String(formData.get("username") || "");
  const pass = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/") || "/";
  if (!process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD || !process.env.AUTH_SECRET) {
    throw new Error("未配置 AUTH_USERNAME / AUTH_PASSWORD / AUTH_SECRET");
  }
  if (!checkPassword(user, pass)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 3600,
  });
  redirect(next.startsWith("/") ? next : "/");
}

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
  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr", maxWidth: 480 }}>
      <main>
        <section className="hero">
          <h1>登录</h1>
          <p className="hero-note">账号密码在 Vercel 环境变量中配置，不写进代码。</p>
          {missing.length ? (
            <p className="empty">
              当前部署读不到：{missing.join("、")}
              <br />
              请在 Vercel → Project → Settings → Environment Variables 勾选 Production，保存后选 Redeploy，并关闭 Use existing Build Cache。
              {checks.AUTH_SECRET === false && process.env.AUTH_SECRET?.trim()
                ? "（AUTH_SECRET 已存在但长度不足 16 位）"
                : ""}
            </p>
          ) : null}
          {sp.error ? <p className="empty">账号或密码不正确。</p> : null}
          <form action={loginAction} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <input type="hidden" name="next" value={sp.next || "/"} />
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
