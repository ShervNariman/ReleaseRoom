import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  experimental: { cpus: 2, serverActions: { bodySizeLimit: "64kb" } },
};

export default nextConfig;
