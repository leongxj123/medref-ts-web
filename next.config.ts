import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Ensure gzipped corpus is available to Server Components via fs on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./public/data/**/*"],
  },
};

export default nextConfig;
