// apps/web/next.config.js
// Add API proxy for development

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config

  // ✅ API Proxy for development (frontend port 3000 → backend port 3001)
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/support/:path*',
        destination: 'http://localhost:3001/api/support/:path*',
      },
      // Add other API routes as needed
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      }
    ] : []
  },

  // ✅ Environment variables for frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || ''
      : 'http://localhost:3001'
  }
}

module.exports = nextConfig