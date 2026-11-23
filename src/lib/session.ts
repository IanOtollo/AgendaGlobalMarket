// Signed session cookie (HMAC-SHA256). Uses Web Crypto only, so it works in the Edge middleware and in Node.
const enc = new TextEncoder();
const dec = new TextDecoder();

export const COOKIE = "agm_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function createSession(email: string, secret: string) {
  const payload = b64url(enc.encode(JSON.stringify({ sub: email, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined, secret: string | undefined): Promise<{ sub: string } | null> {
  if (!token || !secret || secret.length < 32) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const p = JSON.parse(dec.decode(fromB64url(payload)));
    if (typeof p.sub !== "string" || typeof p.exp !== "number" || p.exp < Date.now() / 1000) return null;
    return { sub: p.sub };
  } catch {
    return null;
  }
}
