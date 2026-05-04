/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.kie.ai' },
      { protocol: 'https', hostname: '*.kie.ai' },
    ],
  },
};

export default nextConfig;
