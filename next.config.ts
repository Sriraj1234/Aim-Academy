import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */

  typescript: {
    ignoreBuildErrors: true,
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: false, // process.env.NODE_ENV === "development", // Enable in dev for testing
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
