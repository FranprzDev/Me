import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace en este proyecto (evita que Turbopack tome
  // un lockfile de un directorio superior).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
