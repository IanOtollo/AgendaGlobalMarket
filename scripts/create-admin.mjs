// Creates or updates the admin sign-in. Usage:
//   node scripts/create-admin.mjs [--email you@company.com] [--password "your password"] [--rotate-secret]
// With no --password a strong one is generated and written to .admin-initial-password.txt (read it, sign in,
// then delete that file). Writes ADMIN_EMAIL, ADMIN_PASSWORD_HASH and SESSION_SECRET to .env.local.
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const envPath = ".env.local";
const env = Object.fromEntries(
  (existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : []).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const email = (arg("--email") ?? env.ADMIN_EMAIL ?? "admin@agendaglobalmarket.co.ke").trim().toLowerCase();
const given = arg("--password");
const password = given ?? randomBytes(15).toString("base64url");
if (password.length < 12) { console.error("Password must be at least 12 characters."); process.exit(1); }

const salt = randomBytes(16);
env.ADMIN_EMAIL = email;
env.ADMIN_PASSWORD_HASH = `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || args.includes("--rotate-secret")) env.SESSION_SECRET = randomBytes(48).toString("base64url");

writeFileSync(envPath, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
if (!given) writeFileSync(".admin-initial-password.txt", `${password}\n`);
console.log(`Admin sign-in saved for ${email}.`);
console.log(given ? "Password set from --password." : "A generated password was written to .admin-initial-password.txt. Read it, sign in, then delete the file.");
console.log("Restart the server so it picks up .env.local.");
