import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // In-app camera photos arrive as base64 data URLs (about 0.5 to 1.5 MB at 1280 px).
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
