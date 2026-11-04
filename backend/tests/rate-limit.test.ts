// Hız sınırı gerçek istemci IP'sine göre çalışmalı (Traefik -> Next.js -> API zinciri).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'rate-limit-test-secret';

import { clientIp } from '../src/utils/rateLimit';
import { server } from '../src/server';

function fakeRequest(remoteAddress: string, xff?: string | string[]): any {
  return { socket: { remoteAddress }, ip: remoteAddress, headers: xff === undefined ? {} : { 'x-forwarded-for': xff } };
}

describe('clientIp', () => {
  test('iç ağdan gelen istekte en sağdaki X-Forwarded-For değeri (Traefik) kullanılır', () => {
    expect(clientIp(fakeRequest('127.0.0.1', '203.0.113.9'))).toBe('203.0.113.9');
    expect(clientIp(fakeRequest('::ffff:127.0.0.1', '6.6.6.6, 203.0.113.9'))).toBe('203.0.113.9');
    expect(clientIp(fakeRequest('172.18.0.5', ['6.6.6.6', '198.51.100.7']))).toBe('198.51.100.7');
  });

  test('dış ağdan doğrudan gelen istekte başlık yok sayılır', () => {
    expect(clientIp(fakeRequest('198.51.100.20', '1.2.3.4'))).toBe('198.51.100.20');
  });

  test('başlık yoksa ya da geçersizse soket adresi kullanılır', () => {
    expect(clientIp(fakeRequest('127.0.0.1'))).toBe('127.0.0.1');
    expect(clientIp(fakeRequest('127.0.0.1', 'not-an-ip'))).toBe('127.0.0.1');
  });
});

describe('rate limit (server)', () => {
  afterAll(async () => {
    await server.close();
  });

  test('genel sınır istemci başına ayrı sayılır', async () => {
    // Kimliksiz istek 401 döner ama genel sınır kimlik kontrolünden önce sayar.
    const hit = (ip: string) => server.inject({ method: 'GET', url: '/api/v1/user/balance', headers: { 'x-forwarded-for': ip } });
    for (let i = 0; i < 100; i++) {
      expect((await hit('203.0.113.1')).statusCode).toBe(401);
    }
    expect((await hit('203.0.113.1')).statusCode).toBe(429);
    // Başka bir istemci etkilenmez (eskiden tüm kullanıcılar tek sayacı paylaşıyordu).
    expect((await hit('203.0.113.2')).statusCode).toBe(401);
  });

  test('kayıt ucu IP başına saatte 10 istekle sınırlı', async () => {
    const register = (ip: string) => server.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'invalid', password: 'x' }, // DB'ye gitmeden 400 döner
      headers: { 'x-forwarded-for': ip },
    });
    for (let i = 0; i < 10; i++) {
      expect((await register('198.51.100.50')).statusCode).toBe(400);
    }
    expect((await register('198.51.100.50')).statusCode).toBe(429);
    expect((await register('198.51.100.51')).statusCode).toBe(400);
  });

  test('şifre sıfırlama isteği IP başına 15 dakikada 5 istekle sınırlı', async () => {
    const forgot = () => server.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'invalid' }, // DB'ye gitmeden 400 döner
      headers: { 'x-forwarded-for': '198.51.100.60' },
    });
    for (let i = 0; i < 5; i++) {
      expect((await forgot()).statusCode).toBe(400);
    }
    expect((await forgot()).statusCode).toBe(429);
  });
});
