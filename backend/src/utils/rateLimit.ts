import { BlockList, isIP } from 'net';
import type { FastifyRequest } from 'fastify';

// Canlı istek zinciri: istemci -> Traefik (Coolify) -> Next.js rewrite -> bu API.
// Bu API'ye gelen soket adresi her zaman Next.js sunucusudur (127.0.0.1 ya da
// iç Docker ağı). Bu yüzden varsayılan `request.ip` ile hız sınırı TÜM
// kullanıcılar için tek bir sayaç oluyordu.
//
// Next.js vekili X-Forwarded-For eklemiyor; Traefik ise kendi gördüğü istemci
// adresini listenin SONUNA ekliyor. Soket iç ağdan geliyorsa gerçek istemci,
// X-Forwarded-For'un en sağdaki değeridir (istemcinin yazdığı sol değerler
// taklit edilebilir, Traefik'in eklediği en sağdaki değer edilemez).
// Soket dış ağdan geliyorsa (API'ye doğrudan erişim) soket adresi kullanılır.
// Not: önüne Cloudflare gibi ikinci bir vekil eklenirse bu kural yeniden
// değerlendirilmelidir (en sağdaki değer vekilin adresi olur).
const internalNetworks = new BlockList();
internalNetworks.addSubnet('127.0.0.0', 8, 'ipv4');
internalNetworks.addSubnet('10.0.0.0', 8, 'ipv4');
internalNetworks.addSubnet('172.16.0.0', 12, 'ipv4');
internalNetworks.addSubnet('192.168.0.0', 16, 'ipv4');
internalNetworks.addAddress('::1', 'ipv6');
internalNetworks.addSubnet('fc00::', 7, 'ipv6');

function normalizeIp(value: string): string {
  const ip = value.trim();
  if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
  return ip;
}

function isInternal(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return internalNetworks.check(ip, 'ipv4');
  if (family === 6) return internalNetworks.check(ip, 'ipv6');
  return false;
}

export function clientIp(request: FastifyRequest): string {
  const socketIp = normalizeIp(request.socket?.remoteAddress || request.ip || '');
  if (!isInternal(socketIp)) return socketIp || 'unknown';

  const header = request.headers['x-forwarded-for'];
  const raw = Array.isArray(header) ? header.join(',') : header;
  if (raw) {
    const hops = raw.split(',').map(normalizeIp).filter((ip) => isIP(ip) !== 0);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return socketIp || 'unknown';
}

// Uç bazlı sınırlar (IP başına). Genel sınır server.ts'de (dakikada 100).
export const ROUTE_RATE_LIMITS = {
  register: { max: 10, timeWindow: '1 hour' }, // kayıt başına 100 ₺ ücretsiz bakiye veriliyor
  login: { max: 20, timeWindow: '15 minutes' },
  forgotPassword: { max: 5, timeWindow: '15 minutes' }, // e-posta gönderiyor
  resetPassword: { max: 10, timeWindow: '15 minutes' },
  analyzeImage: { max: 20, timeWindow: '1 minute' }, // ücretli Gemini çağrısı
} as const;
