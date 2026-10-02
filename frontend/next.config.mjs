import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["children-store-dev.preview.emergentagent.com", "children-store-dev.cluster-5.preview.emergentcf.cloud", "*.emergentagent.com", "*.emergentcf.cloud"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "wtbgdxjupdctncopwvek.supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Old WordPress/WooCommerce URLs still indexed by Google -> new pages (301).
  async redirects() {
    return [
      { source: "/wishsuite", destination: "/account", permanent: true },
      { source: "/wishlist", destination: "/account", permanent: true },
      { source: "/my-account/:path*", destination: "/account", permanent: true },
      { source: "/cart", destination: "/checkout", permanent: true },
      { source: "/product-category/:slug*", destination: "/category/:slug*", permanent: true },
      { source: "/product-tag/:tag", destination: "/shop", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/privacy-policy", destination: "/legal/privacy", permanent: true },
      { source: "/terms-and-conditions", destination: "/legal/terms", permanent: true },
      { source: "/refund_returns", destination: "/legal/returns", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Long-cache hashed static build assets (JS/CSS chunks, fonts).
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache Next-optimized images (URLs change when src/params change).
        source: "/_next/image(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public static assets (favicons, brand images in /public).
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
