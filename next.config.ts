import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
