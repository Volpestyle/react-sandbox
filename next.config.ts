import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Server-side only variables
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    REGION: process.env.REGION,
    AMADEUS_API_KEY: process.env.AMADEUS_API_KEY,
    AMADEUS_API_SECRET: process.env.AMADEUS_API_SECRET,
    AMADEUS_API_URL: process.env.AMADEUS_API_URL,
    GOOGLE_MAPS_PLATFORM_API_KEY: process.env.GOOGLE_MAPS_PLATFORM_API_KEY,
  },
};

export default nextConfig;
