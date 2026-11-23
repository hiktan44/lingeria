process.env.JWT_SECRET = process.env.JWT_SECRET || 'server-test-secret';

import jwt from 'jsonwebtoken';
import { server } from '../src/server';

const authToken = jwt.sign({ id: '00000000-0000-4000-8000-000000000000', email: 'fixture@example.test' }, process.env.JWT_SECRET as string);

describe('Server Security and Health Tests', () => {
  afterAll(async () => {
    await server.close();
  });

  test('GET /health returns 200 and format', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
  });

  test('GET /api/v1 returns 200 with db status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('dbConnected');
  });

  test('GET /nonexistent returns 404', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/nonexistent'
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('error');
  });

  test('POST /api/v1/ai/translate without auth returns 401', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/translate',
      payload: { text: 'merhaba' }
    });

    expect(response.statusCode).toBe(401);
  });

  test('POST /api/v1/ai/translate with auth and empty body returns translated empty', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/translate',
      payload: {},
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('translated', '');
  });

  test('POST /api/v1/ai/translate rejects oversized text', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/translate',
      payload: { text: 'a'.repeat(5001) },
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/ai/analyze-image without auth returns 401 (paid Gemini)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/analyze-image',
      payload: { image: 'data:image/png;base64,AAAA' }
    });

    expect(response.statusCode).toBe(401);
  });

  test('POST /api/v1/ai/analyze-image with auth and empty body returns default', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/analyze-image',
      payload: {},
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('category', 'Clothing');
  });

  test('POST /api/v1/ai/analyze-image rejects non-raster data URL', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/analyze-image',
      payload: { image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' },
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/ai/generate rejects non-image data URL in mankenImage', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/generate',
      payload: { imageUrl: 'data:image/png;base64,AAAA', mankenImage: 'data:text/html;base64,PGgxPng8L2gxPg==' },
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/ai/generate rejects oversized desenImage', async () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(14 * 1024 * 1024);
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/generate',
      payload: { imageUrl: 'data:image/png;base64,AAAA', desenImage: big },
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/ai/generate without auth returns 401', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/generate',
      payload: { imageUrl: 'test' }
    });

    expect(response.statusCode).toBe(401);
  });

  test('POST /api/v1/ai/generate without imageUrl returns 400', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/generate',
      payload: {},
      headers: { authorization: 'Bearer faketoken' }
    });

    expect([400, 401]).toContain(response.statusCode);
  });

  test('POST /api/v1/auth/register with invalid email returns 400', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'invalid', password: 'short' }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/auth/register with short password returns 400', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'test@test.com', password: '123' }
    });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/v1/auth/login with missing fields returns 400', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {}
    });

    expect(response.statusCode).toBe(400);
  });

  test('GET /api/v1/user/balance without auth returns 401', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/user/balance'
    });

    expect(response.statusCode).toBe(401);
  });

  test('GET /api/v1/user/generations without auth returns 401', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/user/generations'
    });

    expect(response.statusCode).toBe(401);
  });
});
