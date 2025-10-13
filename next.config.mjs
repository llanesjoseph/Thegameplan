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
      },
      {
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

  // Skip static generation for dynamic routes
  // These routes use useSearchParams() and require client-side rendering
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  // Redirects for backwards compatibility
  async redirects() {
    return [
      {
        source: '/contributors',
        destination: '/coaches',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/contributors/:path*',
        destination: '/coaches/:path*',
        permanent: true,
      },
    ]
  },

  // Vercel deployment - API routes enabled as serverless functions
  // Dynamic routes that should not be statically optimized
  experimental: {
    missingSuspenseWithCSRBailout: false, // Disable warnings for useSearchParams without Suspense
  },
}

export default nextConfig