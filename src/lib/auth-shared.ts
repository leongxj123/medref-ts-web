import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "medref_session";
const DAYS = 14;

export function timingEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("请在环境变量中设置至少 16 位的 AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function signSession(username: string) {
  return new SignJWT({ u: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  return String(payload.u || "");
}

export function checkPassword(user: string, pass: string) {
  const expectUser = process.env.AUTH_USERNAME || "";
  const expectPass = process.env.AUTH_PASSWORD || "";
  if (!expectUser || !expectPass) return false;
  return timingEqual(user, expectUser) && timingEqual(pass, expectPass);
}

export function checkApiKey(given: string | null) {
  const expect = process.env.API_KEY || "";
  if (!expect || !given) return false;
  return timingEqual(given, expect);
}
