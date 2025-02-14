/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize file watching
  webpack: (config, { isServer }) => {
    // Reduce the number of files being watched
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ["**/.git/**", "**/node_modules/**", "**/.next/**"],
    };
    return config;
  },
  // Disable unnecessary features
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  output: "standalone",
  images: { unoptimized: true },
};

module.exports = nextConfig;
