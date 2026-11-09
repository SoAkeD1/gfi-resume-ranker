/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep these Node libraries out of the bundle; they are loaded at runtime by /api/rank.
    serverComponentsExternalPackages: ["mammoth", "unpdf"],
  },
};

export default nextConfig;
