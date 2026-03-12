import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false as unknown as NextConfig["devIndicators"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "f001.backblazeb2.com", // Backblaze B2
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org", // Wikipedia (para la imagen "Image Not Found")
      },
      {
        protocol: 'https',
        hostname: 'app.linkaform.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
