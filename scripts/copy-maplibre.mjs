// Next's bundler cannot build MapLibre's web worker, so the worker files are served as plain static files.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/maplibre-gl/dist";
if (existsSync(src)) {
  mkdirSync("public/maplibre", { recursive: true });
  for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) cpSync(`${src}/${f}`, `public/maplibre/${f}`);
}
