/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["*.trycloudflare.com", "*.trycloudflare.com:*", "localhost:3000"]
};

export default nextConfig;

