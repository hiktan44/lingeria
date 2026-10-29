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
    const nativeMigration = require('node:fs').readFileSync(require('node:path').join(__dirname, '../migrations/20261029_issued_login_journal.sql'), 'utf8');
    const client=await db.getClient();
    try { await client.query('BEGIN'); await client.query(nativeMigration); await client.query('COMMIT'); } finally {client.release()}
  });

  beforeEach(async () => {
    await db.query('TRUNCATE users CASCADE');
    await db.query('TRUNCATE lingeria_issued_login_events');
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
    (await db.query('SELECT actor_id AS user_id, method FROM lingeria_issued_login_events ORDER BY at')).rows;

  test('table has only id, user_id, method, at and an index on at', async () => {
    const cols = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lingeria_issued_login_events' ORDER BY ordinal_position"
    );
    expect(cols.rows).toEqual([
      { column_name: 'id', data_type: 'text' },
      { column_name: 'actor_id', data_type: 'text' },
      { column_name: 'method', data_type: 'text' },
      { column_name: 'at', data_type: 'timestamp with time zone' },
      { column_name: 'excluded', data_type: 'boolean' },
    ]);
    const idx = await db.query("SELECT indexname FROM pg_indexes WHERE tablename = 'login_events'");
    expect(idx.rows.map((r: any) => r.indexname)).toContain('lingeria_issued_login_events_at');
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
    const raw = await db.query('SELECT * FROM lingeria_issued_login_events');
    expect(JSON.stringify(raw.rows)).not.toContain('qa@example.test');
  });

  test('wrong password, unknown account and duplicate register record nothing', async () => {
    await db.query("INSERT INTO users (email, password) VALUES ('x@example.test', 'not-a-bcrypt-hash')");
    expect((await login('x@example.test', 'whatever')).statusCode).toBe(401);
    expect((await login('nobody@example.test', 'Test-pass-123')).statusCode).toBe(401);
    expect((await register('x@example.test')).statusCode).toBe(409);
    expect(await events()).toEqual([]);
  });

  test('deleting a user preserves native events', async () => {
    await register('del@example.test');
    await db.query("DELETE FROM users WHERE email = 'del@example.test'");
    expect((await events()).length).toBe(1);
  });

  test('login and register withhold tokens when the native table is missing', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await db.query('ALTER TABLE lingeria_issued_login_events RENAME TO lingeria_issued_login_events_off');
    try {
      expect((await register('nt@example.test')).statusCode).toBe(503);
      const l = await login('nt@example.test', 'Test-pass-123');
      expect(l.statusCode).toBe(503);
      expect(JSON.parse(l.payload).token).toBeUndefined();
    } finally {
      err.mockRestore();
      await db.query('ALTER TABLE lingeria_issued_login_events_off RENAME TO lingeria_issued_login_events');
    }
  });
});
