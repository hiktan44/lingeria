// login_events entegrasyon testi — gercek route + gercek pg katmani.
// Gecici bir Postgres gerektirir: TEST_POSTGRES_HOST/PORT/USER/PASSWORD/DB.
// Tanimli degilse atlanir (mevcut test akisini etkilemez).
const hasDb = !!process.env.TEST_POSTGRES_DB;
const d = hasDb ? describe : describe.skip;

d('login_events audit log (PostgreSQL)', () => {
  let server: any;
  let db: any;
  let initDatabase: () => Promise<void>;

  beforeAll(async () => {
    process.env.POSTGRES_HOST = process.env.TEST_POSTGRES_HOST || '127.0.0.1';
    process.env.POSTGRES_PORT = process.env.TEST_POSTGRES_PORT || '5432';
    process.env.POSTGRES_USER = process.env.TEST_POSTGRES_USER || 'postgres';
    process.env.POSTGRES_PASSWORD = process.env.TEST_POSTGRES_PASSWORD || '';
    process.env.POSTGRES_DB = process.env.TEST_POSTGRES_DB;
    jest.resetModules();
    db = require('../src/config/database');
    initDatabase = db.initDatabase;
    server = require('../src/server').server;
    await db.query('DROP TABLE IF EXISTS login_events, generations, password_reset_tokens, users CASCADE');
    await initDatabase();
    await initDatabase(); // idempotent
  });

  beforeEach(async () => {
    await db.query('TRUNCATE users CASCADE');
  });

  afterAll(async () => {
    await server.close();
    await db.dbConfig.pool.end();
  });

  const register = (email: string, password = 'Test-pass-123') =>
    server.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password } });
  const login = (email: string, password: string) =>
    server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } });
  const events = async () =>
    (await db.query('SELECT user_id::text AS user_id, method FROM login_events ORDER BY at')).rows;

  test('table has only id, user_id, method, at and an index on at', async () => {
    const cols = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'login_events' ORDER BY ordinal_position"
    );
    expect(cols.rows).toEqual([
      { column_name: 'id', data_type: 'text' },
      { column_name: 'user_id', data_type: 'uuid' },
      { column_name: 'method', data_type: 'text' },
      { column_name: 'at', data_type: 'timestamp with time zone' },
    ]);
    const idx = await db.query("SELECT indexname FROM pg_indexes WHERE tablename = 'login_events'");
    expect(idx.rows.map((r: any) => r.indexname)).toContain('idx_login_events_at');
  });

  test('register records one register event; successful login records password', async () => {
    const r = await register('qa@example.test');
    expect(r.statusCode).toBe(201);
    const userId = JSON.parse(r.payload).user.id;
    const l = await login('qa@example.test', 'Test-pass-123');
    expect(l.statusCode).toBe(200);
    expect(await events()).toEqual([
      { user_id: userId, method: 'register' },
      { user_id: userId, method: 'password' },
    ]);
    const raw = await db.query('SELECT * FROM login_events');
    expect(JSON.stringify(raw.rows)).not.toContain('qa@example.test');
  });

  test('wrong password, unknown account and duplicate register record nothing', async () => {
    await db.query("INSERT INTO users (email, password) VALUES ('x@example.test', 'not-a-bcrypt-hash')");
    expect((await login('x@example.test', 'whatever')).statusCode).toBe(401);
    expect((await login('nobody@example.test', 'Test-pass-123')).statusCode).toBe(401);
    expect((await register('x@example.test')).statusCode).toBe(409);
    expect(await events()).toEqual([]);
  });

  test('deleting a user cascades its events', async () => {
    await register('del@example.test');
    await db.query("DELETE FROM users WHERE email = 'del@example.test'");
    expect(await events()).toEqual([]);
  });

  test('login and register still succeed when the table is missing', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await db.query('DROP TABLE login_events');
    try {
      expect((await register('nt@example.test')).statusCode).toBe(201);
      const l = await login('nt@example.test', 'Test-pass-123');
      expect(l.statusCode).toBe(200);
      expect(JSON.parse(l.payload).token).toBeTruthy();
      expect(err).toHaveBeenCalled();
    } finally {
      err.mockRestore();
      await initDatabase();
    }
  });
});
