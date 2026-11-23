const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  // Native/WASM image renderer used for share cards: keep it out of the bundle.
  // NEXT_DIST_DIR lets a production build run without touching the dev server's .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js", "satori"],
    // Share-card images read these files at run time; make sure the host bundles them.
    outputFileTracingIncludes: { "/**": ["./node_modules/@fontsource/jost/files/jost-latin-400-normal.woff", "./node_modules/@fontsource/jost/files/jost-latin-700-normal.woff", "./public/brand/logo.png", "./data/areas.json"] },
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/legal/terms", statusCode: 301 },
      { source: "/privacy", destination: "/legal/privacy", statusCode: 301 },
      { source: "/legal/accessibility", destination: "/accessibility", statusCode: 301 },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // The admin area must never be framed or cached.
      { source: "/admin/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
