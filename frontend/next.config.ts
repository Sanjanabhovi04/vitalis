import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  async rewrites() {
    return [
      {
        source: "/api/triage",
        destination: "http://127.0.0.1:8000/api/triage",
      },
    ];
  },
};

export default nextConfig;
