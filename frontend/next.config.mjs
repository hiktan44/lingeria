/** @type {import('next').NextConfig} */

// Sayfa yanıtlarına eksik güvenlik başlıkları. /api ve /health arka uca
// (helmet) gidiyor; onların kendi başlıkları korunur, burada dokunulmaz.
// CSP olarak yalnızca frame-ancestors (tam CSP canlıyı bozabilir).
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Uygulama kamera/mikrofon/konum API'si kullanmıyor (görsel yükleme dosya seçiciyle).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
    : []),
];

const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Uygulama next/image kullanmıyor; /_next/image görsel iyileştirme ucu
    // kapatıldı (Next 14.x'te yaması olmayan görsel iyileştirme açıklarının
    // yüzeyi, ayrıca *.kie.ai için sunucu tarafı getirme vekili).
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.kie.ai' },
      { protocol: 'https', hostname: '*.kie.ai' },
    ],
  },
  async headers() {
    return [
      { source: '/:path((?!api/|health$).*)', headers: securityHeaders },
    ];
  },
  async rewrites() {
    // This URL is server-side only. Browser requests stay on the Lingeria origin.
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ];
  },
};

export default nextConfig;
