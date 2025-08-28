/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/website' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/website/' : '',
}

module.exports = nextConfig