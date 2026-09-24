import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-leaflet@4.2 (React 18) no soporta el doble montaje de efectos que
  // hace StrictMode en dev con React 19: al remontar el MapContainer sobre
  // el mismo <div>, Leaflet truena con "Map container is already
  // initialized". Solo afecta al dev server, no a producción.
  reactStrictMode: false,
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
      {
        protocol: "https",
        hostname: "b2.linkaform.com", 
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;