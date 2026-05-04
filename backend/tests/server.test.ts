import { server } from '../src/server';

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

  test('POST /api/v1/ai/translate with empty body returns translated empty', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/translate',
      payload: {}
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('translated', '');
  });

  test('POST /api/v1/ai/analyze-image with empty body returns default', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/ai/analyze-image',
      payload: {}
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('category', 'Clothing');
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
