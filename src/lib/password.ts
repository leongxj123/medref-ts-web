import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;

/** Format: scrypt$<salt_b64>$<hash_b64> */
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPasswordHash(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expect = Buffer.from(parts[2], "base64url");
    const got = scryptSync(password, salt, expect.length, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
    return got.length === expect.length && timingSafeEqual(got, expect);
  } catch {
    return false;
  }
}

export function isPasswordHash(value: string) {
  return value.startsWith("scrypt$") && value.split("$").length === 3;
}
