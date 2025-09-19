/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization - disabled for static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'gostanford.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      }
      ,{
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      }
    ],
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Compression
  compress: true,

  // No static export - we need API routes for production
  // distDir: 'out', // Commented out to enable API routes

  // Disable type checking and linting during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig