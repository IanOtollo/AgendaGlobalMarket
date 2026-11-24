import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BRAND } from "@/lib/config";

// Social share card in the brand palette (navy, yellow, white). Rendered with Satori (JSX to SVG) and Resvg (SVG to PNG)
// using a bundled Inter font, so it works the same on every platform and never downloads anything.
const fontFile = (w: 400 | 700) => fs.readFileSync(path.join(process.cwd(), "node_modules", "@fontsource", "jost", "files", `jost-latin-${w}-normal.woff`));
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;
const loadFonts = () => (fonts ??= [{ name: "Jost", data: fontFile(400), weight: 400, style: "normal" }, { name: "Jost", data: fontFile(700), weight: 700, style: "normal" }]);

const logoUri = () => `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo.png")).toString("base64")}`;

export async function ogCard({ eyebrow, title, lines = [], brandOnly = false }: { eyebrow: string; title: string; lines?: string[]; brandOnly?: boolean }) {
  const svg = await satori(
    brandOnly ? (
      // Link-preview card: the logo, large and centred, on a light panel.
      <div style={{ width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FA", fontFamily: "Jost" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logoUri()} width={636} height={520} />
      </div>
    ) : (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F8FA", color: "#101F42", padding: 72, fontFamily: "Jost" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logoUri()} width={170} height={139} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: "#4B5563", marginBottom: 18, fontWeight: 700 }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 34 ? 68 : 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          {lines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 32, color: "#4B5563" }}>
              {lines.map((l) => <div key={l} style={{ display: "flex" }}>{l}</div>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 56, height: 8, background: "#FFC105", borderRadius: 4, marginRight: 20 }} />
          <div style={{ display: "flex", fontSize: 26, color: "#4B5563" }}>{BRAND.tagline}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: loadFonts() },
  );
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
