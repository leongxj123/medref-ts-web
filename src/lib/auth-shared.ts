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
  const expectPass = process.env.AUTH_PASSWORD?.trim() || "";
  if (!expectUser || !expectPass) return false;
  return timingEqual(user, expectUser) && timingEqual(pass, expectPass);
}

export function checkApiKey(given: string | null) {
  const expect = process.env.API_KEY?.trim() || "";
  if (!expect || !given) return false;
  return timingEqual(given, expect);
}
