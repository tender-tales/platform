/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Removed basePath and assetPrefix for local development with API routes
}

module.exports = nextConfig
