/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['grammy', 'axios', 'moment', 'gpt-3-encoder'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '92eaarerohohicw5.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  reactStrictMode: true,  // Включение строгого режима React для лучшего контроля ошибок
  swcMinify: true,  // Включение SWC для ускоренной минификации
  
  async headers() {
    return [
      {
        source: '/(.*)', // Применяется ко всем маршрутам
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
