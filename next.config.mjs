/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { 
    serverComponentsExternalPackages: ['grammy'], 
  },
  images: {
    domains: ['92eaarerohohicw5.public.blob.vercel-storage.com'],
  },
};

export default nextConfig;
