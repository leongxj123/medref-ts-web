import { randomBytes, scryptSync } from "crypto";

const pass = process.argv[2];
if (!pass) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(pass, salt, 32, { N: 16384, r: 8, p: 1 });
console.log(`scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`);
