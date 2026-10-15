import type { NextConfig } from "next";

// GITHUB_PAGES=1 gera site estático (output export) para o GitHub Actions
// publicar em https://<owner>.github.io/configurador-3d/. Sem a env, o build
// segue normal para a Vercel. (PPR/cacheComponents não existe em export mode.)
const isPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isPages
    ? {
        output: "export" as const,
        basePath: "/configurador-3d",
        images: { unoptimized: true },
        cacheComponents: false,
        partialPrefetching: false,
      }
    : {}),
};

export default nextConfig;
