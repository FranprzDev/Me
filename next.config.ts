import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace en este proyecto (evita que Turbopack tome
  // un lockfile de un directorio superior).
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.wgsl": {
        loaders: ["@vgpu/wgsl/loader-webpack"],
        as: "*.js",
      },
    },
  },
  // Fija también la raíz para el tracing/prerender del build. Sin esto, Next
  // infiere la raíz por los múltiples lockfiles (hay uno en el home del
  // usuario con React 18) y puede mezclar copias de React durante el
  // prerender -> "Expected workStore to be initialized". Forzar la raíz al
  // proyecto evita ese cruce.
  outputFileTracingRoot: path.resolve(__dirname),
  // Renamed world routes: old links keep working (308, permanent).
  async redirects() {
    return [
      { source: "/curso-n8n", destination: "/teaching", permanent: true },
      { source: "/university", destination: "/education", permanent: true },
      // The in-browser recruiter model was replaced by the MCP server.
      { source: "/for-recruiters", destination: "/me", permanent: true },
      // The old hand-committed CV PDF: shared links land on the generated
      // Applied AI CV (bare URL, so it always revalidates to the current file).
      {
        source: "/cv/FranciscoPerez-AIEngineer.pdf",
        destination: "/cv/files/francisco-perez-cv-applied-ai-en.pdf",
        permanent: true,
      },
    ];
  },
  // /_next/static is already served immutable by Next. Files in /public are
  // not content-hashed, so they get a long but revalidating cache instead.
  async headers() {
    return [
      {
        source: "/me/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      // Only the PDFs: /cv/<variant> are pages and keep Next's own caching.
      // The site links them as ?v=<content hash> (cvPdfPath), so a versioned
      // URL never changes content and can be cached for good. A bare URL
      // (old shares, typed links) always revalidates, so a regenerated CV
      // reaches everyone on the next request.
      {
        source: "/cv/files/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/cv/files/:file*",
        has: [{ type: "query", key: "v" }],
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
