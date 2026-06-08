import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace en este proyecto (evita que Turbopack tome
  // un lockfile de un directorio superior).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Fija también la raíz para el tracing/prerender del build. Sin esto, Next
  // infiere la raíz por los múltiples lockfiles (hay uno en el home del
  // usuario con React 18) y puede mezclar copias de React durante el
  // prerender -> "Expected workStore to be initialized". Forzar la raíz al
  // proyecto evita ese cruce.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
