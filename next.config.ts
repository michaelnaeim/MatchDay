import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Leaflet is client-only (MapView uses dynamic import + ssr: false)
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;