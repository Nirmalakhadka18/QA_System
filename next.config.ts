import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
