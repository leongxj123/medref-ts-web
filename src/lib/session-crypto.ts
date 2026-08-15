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
  try {
    const hdr = JSON.parse(new TextDecoder().decode(b64urlToBytes(header))) as { alg?: string; typ?: string };
    if (hdr.alg !== "HS256") return "";
  } catch {
    return "";
  }
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

/** Unified Secure flag for all session cookie writers. */
export function cookieSecure(req?: { headers?: Headers }) {
  const proto = req?.headers?.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto === "https") return true;
  if (proto === "http") return false;
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function sessionCookieOptions(maxAge = SESSION_DAYS * 24 * 3600, req?: { headers?: Headers }) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(req),
    path: "/",
    maxAge,
    expires: new Date(Date.now() + Math.max(0, maxAge) * 1000),
  };
}

export function serializeSessionCookie(value: string, maxAge = SESSION_DAYS * 24 * 3600, req?: { headers?: Headers }) {
  const parts = [
    `${COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, maxAge)}`,
  ];
  if (maxAge > 0) {
    parts.push(`Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`);
  } else {
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  if (cookieSecure(req)) parts.push("Secure");
  return parts.join("; ");
}

export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

export function applySecurityHeaders(res: { headers: Headers }) {
  for (const [k, v] of Object.entries(securityHeaders())) res.headers.set(k, v);
  return res;
}
