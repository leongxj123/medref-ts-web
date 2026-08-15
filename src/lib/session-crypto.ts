/** Edge-safe HS256 session JWT (no jose / Node APIs). */

export const COOKIE = "medref_session";
export const SESSION_DAYS = 14;

function b64urlFromBytes(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function textBytes(s: string) {
  return new TextEncoder().encode(s);
}

async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", textBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export async function signSessionToken(username: string, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlFromBytes(textBytes(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64urlFromBytes(
    textBytes(
      JSON.stringify({
        u: username,
        iat: now,
        exp: now + SESSION_DAYS * 24 * 3600,
      })
    )
  );
  const data = `${header}.${payload}`;
  const key = await hmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, textBytes(data));
  return `${data}.${b64urlFromBytes(sig)}`;
}

export async function verifySessionToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return "";
  const [header, payload, sig] = parts;
  const key = await hmacKey(secret, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), textBytes(`${header}.${payload}`));
  if (!ok) return "";
  try {
    const json = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))) as {
      u?: string;
      exp?: number;
    };
    if (!json.exp || json.exp * 1000 < Date.now()) return "";
    return String(json.u || "");
  } catch {
    return "";
  }
}

export function sessionCookieOptions() {
  const maxAge = SESSION_DAYS * 24 * 3600;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    path: "/",
    maxAge,
  };
}
