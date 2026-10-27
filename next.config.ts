import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Phase 2 는 force-dynamic 서버 컴포넌트가 많아 Cache Components를 비활성화.
  // Phase 3+ 에서 "use cache" 로 선별 캐싱하도록 재검토.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
