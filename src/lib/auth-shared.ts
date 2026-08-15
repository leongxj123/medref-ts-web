import { isPasswordHash, verifyPasswordHash } from "@/lib/password";
import { signSessionToken, verifySessionToken, COOKIE, SESSION_DAYS } from "@/lib/session-crypto";

export { COOKIE, SESSION_DAYS };

export function timingEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function requireSecret() {
  const s = process.env.AUTH_SECRET?.trim() || "";
  if (s.length < 16) throw new Error("请在环境变量中设置至少 16 位的 AUTH_SECRET");
  return s;
}

export async function signSession(username: string) {
  return signSessionToken(username, requireSecret());
}

export async function verifySession(token: string) {
  return verifySessionToken(token, requireSecret());
}

export function checkPassword(user: string, pass: string) {
  const expectUser = process.env.AUTH_USERNAME?.trim() || "";
  if (!expectUser || !timingEqual(user, expectUser)) return false;

  const hash = process.env.AUTH_PASSWORD_HASH?.trim() || "";
  if (hash) return verifyPasswordHash(pass, hash);

  const expectPass = process.env.AUTH_PASSWORD?.trim() || "";
  if (!expectPass) return false;
  if (isPasswordHash(expectPass)) return verifyPasswordHash(pass, expectPass);
  return timingEqual(pass, expectPass);
}

export function checkApiKey(given: string | null) {
  const expect = process.env.API_KEY?.trim() || "";
  if (!expect || !given) return false;
  return timingEqual(given, expect);
}

/** Reject open redirects and protocol-relative URLs. */
export function safeNextPath(raw: string | null | undefined) {
  const next = (raw || "/").trim() || "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  if (next.includes("://")) return "/";
  if (next.includes("\\")) return "/";
  return next;
}
