// Run with the server up:  npm run test:privacy      (BASE_URL defaults to http://localhost:3000)
// Needs the admin password: TEST_ADMIN_PASSWORD, or the .admin-initial-password.txt written by `npm run admin:create`.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const env = Object.fromEntries(
  (existsSync(".env.local") ? readFileSync(".env.local", "utf8").split(/\r?\n/) : []).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? env.ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? (existsSync(".admin-initial-password.txt") ? readFileSync(".admin-initial-password.txt", "utf8").trim() : "");
// A fresh fake client address per run, so repeated runs never trip the login rate limit.
const IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

const http = (path, init = {}) => fetch(BASE + path, { redirect: "manual", ...init, headers: { "x-forwarded-for": IP, ...(init.headers ?? {}) } });
const digits = (s) => s.replace(/\D/g, "");
const last9 = (s) => digits(s).slice(-9);

// Phone-number shapes: +country numbers, 00-prefixed numbers, Kenyan 07xx/01xx numbers, formatted +254 7xx xxx xxx.
const PHONE = /(?<![\d.])(?:\+|00)\d[\d \-]{8,14}\d(?!\d)|(?<![\d+])0[17]\d{8}(?!\d)|\+?254[\s-]?\d{3}[\s-]?\d{6}/g;
const PUBLIC_KEYS = new Set(["ref", "slug", "name", "category", "area", "areaSlug", "lat", "lng", "years", "qualifications", "rating", "photo", "gallery", "fromPrice", "availability", "languages", "serviceRadiusKm", "bio", "reviews"]);

let cookie = "";
let adminLine = "";
let sentinels = [];

async function login(password = PASSWORD, email = EMAIL, extra = {}) {
  return http("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN, ...extra }, body: JSON.stringify({ email, password }) });
}

before(async () => {
  assert.ok(EMAIL && PASSWORD, "Admin credentials not found. Run `npm run admin:create` first (or set TEST_ADMIN_PASSWORD).");
  const res = await login();
  assert.equal(res.status, 200, "admin login should succeed");
  cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const db = await (await http("/api/db", { headers: { cookie } })).json();
  adminLine = db.settings.adminPhone;
  // Everything private we know about. None of it may ever appear in a public response.
  const bag = [];
  for (const p of db.providers) bag.push(p.phone, p.email, p.idNumber);
  for (const c of db.customers) bag.push(c.name, c.phone, c.address);
  sentinels = [...new Set(bag.filter((s) => typeof s === "string" && s.trim().length >= 6))].filter((s) => last9(s) !== last9(adminLine) || !/\d{7}/.test(s));
  assert.ok(sentinels.length > 0, "expected private records to compare against");
});

function assertClean(label, body) {
  for (const s of sentinels) assert.ok(!body.includes(s), `${label} leaks private value "${s}"`);
  // "0123456789" is a digit alphabet inside framework polyfills, not a phone number.
  const phones = [...body.matchAll(PHONE)].map((m) => m[0]).filter((ph) => digits(ph) !== "0123456789");
  for (const ph of phones) assert.equal(last9(ph), last9(adminLine), `${label} contains a phone number that is not the public admin line: ${ph}`);
}

const PUBLIC_PAGES = [
  "/", "/services", "/services/plumbing", "/services/plumbing/kilimani", "/pros/daniel-mwangi", "/how-it-works", "/trust-and-safety",
  "/become-a-pro", "/about", "/contact", "/help", "/legal/terms", "/legal/privacy", "/legal/cookies", "/legal/pro-agreement",
  "/legal/cancellation-refunds", "/legal/acceptable-use", "/accessibility", "/login", "/rate/w3", "/sitemap.xml", "/robots.txt", "/this-page-does-not-exist",
];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} has no private data or stray phone numbers (HTML and scripts)`, async () => {
    const res = await http(path);
    assert.ok(res.status < 500, `${path} returned ${res.status}`);
    const html = await res.text();
    assertClean(`${path} HTML`, html);
    const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))].slice(0, 40);
    for (const src of scripts) {
      const js = await (await http(src)).text();
      assertClean(`${path} script ${src}`, js);
    }
  });
}

test("home page HTML is built from the public model only (no demo/seed leftovers, no private fields)", async () => {
  const html = await (await http("/")).text();
  for (const key of ["idNumber", "joinedOn", "employment", "leftReason", "workOrders", "customers", "payments"]) {
    assert.ok(!html.includes(`"${key}"`), `home HTML contains private field name "${key}"`);
  }
});

test("public live stream carries only whitelisted fields", async () => {
  const ctl = new AbortController();
  const res = await http("/api/public/stream", { signal: ctl.signal });
  assert.equal(res.status, 200);
  const reader = res.body.getReader();
  let text = "";
  const deadline = Date.now() + 8000;
  while (!text.includes("\n\n") && Date.now() < deadline) text += new TextDecoder().decode((await reader.read()).value ?? new Uint8Array());
  ctl.abort();
  assertClean("public stream", text);
  const data = JSON.parse(text.split("\n").find((l) => l.startsWith("data: ")).slice(6));
  assert.deepEqual(Object.keys(data.settings).sort(), ["adminPhone", "businessName"]);
  for (const p of data.pros) for (const k of Object.keys(p)) assert.ok(PUBLIC_KEYS.has(k), `public pro has non-whitelisted field "${k}"`);
});

test("public rating API reveals nothing beyond provider name and job title", async () => {
  const gone = await (await http("/api/rate/does-not-exist")).json();
  assert.deepEqual(gone, { state: "unavailable" });
  const res = await http("/api/rate/w3");
  assertClean("/api/rate/w3", await res.text());
});

test("rating submissions are validated and same-origin only", async () => {
  const post = (body, origin = ORIGIN) => http("/api/rate/w3", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
  assert.equal((await post({ stars: 5 }, "https://evil.example")).status, 403);
  assert.equal((await post({ stars: 5 }, "")).status, 403);
  assert.equal((await post({ stars: 9 })).status, 400);
  assert.equal((await post({ stars: "5" })).status, 400);
  assert.equal((await http("/api/rate/nope-nope", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ stars: 5 }) })).status, 404);
});

test("private data API and live stream reject anonymous requests", async () => {
  assert.equal((await http("/api/db")).status, 401);
  assert.equal((await http("/api/db", { method: "PUT", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: "{}" })).status, 401);
  assert.equal((await http("/api/db/stream")).status, 401);
});

test("admin pages redirect anonymous visitors to the login page", async () => {
  for (const path of ["/admin", "/admin/team", "/admin/work-orders", "/admin/work-orders/w1", "/admin/invoice/w1", "/admin/settings"]) {
    const res = await http(path);
    assert.ok([302, 303, 307, 308].includes(res.status), `${path} should redirect, got ${res.status}`);
    assert.match(res.headers.get("location") ?? "", /\/login/, `${path} should redirect to /login`);
  }
});

test("a forged or tampered session cookie is rejected", async () => {
  const bad = "agm_session=" + Buffer.from(JSON.stringify({ sub: EMAIL, exp: 9999999999 })).toString("base64url") + ".AAAA";
  assert.equal((await http("/api/db", { headers: { cookie: bad } })).status, 401);
  const tampered = cookie.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
  assert.equal((await http("/api/db", { headers: { cookie: tampered } })).status, 401);
});

test("login: wrong password fails, cross-site posts are blocked, cookie is HttpOnly", async () => {
  assert.equal((await login("definitely-wrong-password")).status, 401);
  assert.equal((await login(PASSWORD, EMAIL, { Origin: "https://evil.example" })).status, 403);
  const ok = await login();
  assert.equal(ok.status, 200);
  const set = (ok.headers.getSetCookie?.() ?? []).join(";");
  assert.match(set, /HttpOnly/i);
  assert.match(set, /SameSite=lax/i);
});

test("signed-in admin can read data; writes need a same-origin request and a valid body", async () => {
  const read = await http("/api/db", { headers: { cookie } });
  assert.equal(read.status, 200);
  assert.ok(Array.isArray((await read.json()).providers));
  assert.equal((await http("/api/db", { method: "PUT", headers: { cookie, "Content-Type": "application/json", Origin: "https://evil.example" }, body: "{}" })).status, 403);
  assert.equal((await http("/api/db", { method: "PUT", headers: { cookie, "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ db: { nope: true } }) })).status, 400);
});
