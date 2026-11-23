// Keeps the site running on http://localhost:3000: starts `next dev`, restarts it if it exits, and
// restarts it if the health check fails three times in a row. Run with:  npm run dev:keepalive
import { spawn } from "node:child_process";

const PORT = 3000;
let child = null, stopping = false, failures = 0, restarts = 0;
const log = (m) => console.log(`[keep-alive ${new Date().toLocaleTimeString()}] ${m}`);

function start() {
  log(restarts ? `starting server (restart #${restarts})` : "starting server");
  child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "-p", String(PORT)], { stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => {
    child = null;
    if (stopping) return;
    restarts++;
    log(`server exited (${code}); restarting in 3s`);
    setTimeout(start, 3000);
  });
}

async function healthy() {
  try {
    const res = await fetch(`http://localhost:${PORT}/login`, { signal: AbortSignal.timeout(20000) });
    return res.status < 500;
  } catch { return false; }
}

setInterval(async () => {
  if (!child) return;
  if (await healthy()) { failures = 0; return; }
  if (++failures >= 3) { failures = 0; log("health check failed 3 times; restarting"); child?.kill(); }
}, 20000);

const stop = () => { stopping = true; child?.kill(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
start();
