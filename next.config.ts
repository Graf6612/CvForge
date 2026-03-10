import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js NOT to bundle pdf-parse — leave it as a native Node module
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
