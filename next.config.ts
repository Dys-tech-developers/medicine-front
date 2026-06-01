import type { NextConfig } from "next";

/** Hosts ngrok/extra para HMR en dev (sin protocolo). Ver DEV_ALLOWED_ORIGINS en .env.local */
const allowedDevOrigins = [
  "4cae-181-230-38-98.ngrok-free.app",
  ...(process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins,
};

export default nextConfig;
