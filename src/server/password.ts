import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Stored form: scrypt:<saltHex>:<hashHex>
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

// Always performs the full hash so timing does not reveal whether the account exists.
export function verifyPassword(password: string, stored: string | undefined) {
  const [alg, saltHex = "", hashHex = ""] = (stored ?? "").split(":");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt.length ? salt : Buffer.alloc(16), 64);
  return alg === "scrypt" && expected.length === 64 && timingSafeEqual(actual, expected);
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
