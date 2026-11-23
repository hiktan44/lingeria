// /generate kredi akışı: kredi Kie çağrısından önce atomik ayrılır, hata olursa iade edilir.
// Gerçek DB/ağ yok: query ve axios sahte; atomik UPDATE davranışı sahte DB'de taklit edilir.
process.env.JWT_SECRET = 'credit-test-secret';
process.env.KIE_API_KEY = 'credit-test-kie-key';

jest.mock('../src/config/database', () => ({ query: jest.fn() }));
jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

import fs from 'fs';
import os from 'os';
import path from 'path';
import fastify from 'fastify';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { query } from '../src/config/database';
import aiRouterRoutes from '../src/api/ai-router';
import {
  flushPendingRefunds,
  getPendingRefundCount,
  initCreditRefundRecovery,
  refundReservedCredit,
  resetPendingRefundsForTest,
} from '../src/utils/creditRefund';

const mockedQuery = query as unknown as jest.Mock;
const mockedPost = (axios as any).post as jest.Mock;
const mockedGet = (axios as any).get as jest.Mock;

const state = { balance: 0, generations: 0, failSelect: false, failRefundCount: 0 };

function installFakeDb() {
  mockedQuery.mockImplementation(async (text: string, params: any[] = []) => {
    if (text.startsWith('SELECT balance FROM users')) {
      if (state.failSelect) throw new Error('db down');
      return { rows: [{ balance: state.balance }] };
    }
    if (text.startsWith('UPDATE users SET balance = balance - $1') && text.includes('balance >= $1')) {
      const cost = params[0];
      if (state.balance >= cost) {
        state.balance -= cost;
        return { rows: [{ balance: state.balance }] };
      }
      return { rows: [] };
    }
    if (text.startsWith('UPDATE users SET balance = balance + $1')) {
      if (state.failRefundCount > 0) {
        state.failRefundCount -= 1;
        throw new Error('refund db down');
      }
      state.balance += params[0];
      return { rows: [] };
    }
    if (text.startsWith('INSERT INTO generations')) {
      state.generations += 1;
      return { rows: [] };
    }
    throw new Error('unexpected query: ' + text);
  });
}

function kieSucceeds() {
  mockedPost.mockResolvedValue({ data: { data: { taskId: 'task-1' } } });
  mockedGet.mockResolvedValue({
    data: { data: { state: 'success', resultJson: JSON.stringify({ resultUrls: ['https://cdn.example/x.png'] }) } },
  });
}

const token = jwt.sign({ id: 'user-1', email: 'fixture@example.test' }, 'credit-test-secret');
const body = { imageUrl: 'https://example.com/product.png', selectedModel: 'Nano Banana 2', prompt: 'x' }; // maliyet 10

async function buildApp() {
  const app = fastify();
  await app.register(aiRouterRoutes, { prefix: '/api/v1/ai' });
  await app.ready();
  return app;
}

function generate(app: any) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/ai/generate',
    headers: { authorization: `Bearer ${token}` },
    payload: body,
  });
}

describe('/generate kredi ayırma', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    resetPendingRefundsForTest();
    state.balance = 0;
    state.generations = 0;
    state.failSelect = false;
    state.failRefundCount = 0;
    installFakeDb();
  });
  afterEach(() => {
    resetPendingRefundsForTest();
  });

  test('paralel istekler bakiyeyi aşamaz', async () => {
    state.balance = 10; // yalnızca bir üretime yeter
    kieSucceeds();
    const responses = await Promise.all([generate(app), generate(app), generate(app)]);
    const codes = responses.map((r: any) => r.statusCode).sort();
    expect(codes).toEqual([200, 402, 402]);
    expect(state.balance).toBe(0);
    expect(state.generations).toBe(1);
    expect(mockedPost).toHaveBeenCalledTimes(1); // yalnızca bir Kie görevi açıldı
  }, 20000);

  test('Kie hatasında ayrılan kredi iade edilir', async () => {
    state.balance = 10;
    mockedPost.mockRejectedValue(new Error('kie down'));
    const res = await generate(app);
    expect(res.statusCode).toBe(500);
    expect(state.balance).toBe(10);
    expect(state.generations).toBe(0);
  });

  test('bakiye kontrolü DB hatasında üretim başlatılmaz (fail-closed)', async () => {
    state.balance = 100;
    state.failSelect = true;
    kieSucceeds();
    const res = await generate(app);
    expect(res.statusCode).toBe(503);
    expect(mockedPost).not.toHaveBeenCalled();
    expect(state.balance).toBe(100);
  });

  test('yetersiz bakiyede Kie çağrılmaz', async () => {
    state.balance = 5;
    kieSucceeds();
    const res = await generate(app);
    expect(res.statusCode).toBe(402);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  test('geçici DB hatasında iade yeniden denenip krediyi kurtarır', async () => {
    state.balance = 10;
    state.failRefundCount = 2; // ilk 2 iade denemesi başarısız, 3. başarılı
    mockedPost.mockRejectedValue(new Error('kie down'));
    const res = await generate(app);
    expect(res.statusCode).toBe(500);
    expect(state.balance).toBe(10);
    expect(getPendingRefundCount()).toBe(0);
  });

  test('DB kesintisinde başarısız iade kuyruğa alınır ve DB dönünce telafi edilir', async () => {
    state.balance = 10;
    state.failRefundCount = 10; // istek sırasındaki tüm anlık denemeler başarısız
    mockedPost.mockRejectedValue(new Error('kie down'));
    const res = await generate(app);
    expect(res.statusCode).toBe(500);
    expect(state.balance).toBe(0);
    expect(getPendingRefundCount()).toBe(1);

    // DB geri geldiğinde bekleyen iade telafi edilir, ikinci flush çift iade yapmaz.
    state.failRefundCount = 0;
    const firstFlush = await flushPendingRefunds();
    expect(firstFlush).toEqual({ recovered: 1, remaining: 0 });
    expect(state.balance).toBe(10);

    const secondFlush = await flushPendingRefunds();
    expect(secondFlush).toEqual({ recovered: 0, remaining: 0 });
    expect(state.balance).toBe(10);
  });

  test('kalıcı günlük dosyasına yazılan iade yeniden başlatmada kurtarılır', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lingeria-refund-test-'));
    const journalPath = path.join(tmpDir, 'pending-refunds.json');
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    try {
      state.balance = 0;
      state.failRefundCount = 10;
      const immediateOk = await refundReservedCredit({
        userId: 'user-1',
        cost: 12,
        executeQuery: query,
        logger,
        retryDelaysMs: [0],
        journalPath,
      });
      expect(immediateOk).toBe(false);
      expect(fs.existsSync(journalPath)).toBe(true);

      // Süreç yeniden başlatılmış gibi bellek içi durumu temizle.
      resetPendingRefundsForTest();
      state.failRefundCount = 0;

      const recovered = await initCreditRefundRecovery(query, logger, { journalPath });
      expect(recovered).toEqual({ recovered: 1, remaining: 0 });
      expect(state.balance).toBe(12);
      expect(fs.existsSync(journalPath)).toBe(false);
    } finally {
      resetPendingRefundsForTest();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('/generate hata günlüğü', () => {
  test('sağlayıcı hatası günlüğe Kie anahtarı yazmaz', async () => {
    const lines: string[] = [];
    const app = fastify({ logger: { level: 'error', stream: { write: (l: string) => { lines.push(l); } } } });
    await app.register(aiRouterRoutes, { prefix: '/api/v1/ai' });
    await app.ready();
    jest.clearAllMocks();
    state.balance = 10;
    state.generations = 0;
    state.failSelect = false;
    installFakeDb();
    // AxiosError benzeri: config.headers içinde gerçek istekteki Bearer anahtarı bulunur.
    const axiosLike = Object.assign(new Error('Request failed with status code 401'), {
      config: { headers: { Authorization: 'Bearer credit-test-kie-key' } },
      response: { status: 401, data: { code: 401, msg: 'unauthorized' } },
    });
    mockedPost.mockRejectedValue(axiosLike);
    const res = await generate(app);
    await app.close();
    expect(res.statusCode).toBe(500);
    expect(state.balance).toBe(10); // iade
    const logged = lines.join('\n');
    expect(logged).toContain('AI generate error');
    expect(logged).not.toContain('credit-test-kie-key');
  });
});
