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
      {
        source: "/cv/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
