// Real route callbacks with isolated credential/JWT/DB dependencies, no network.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/api/auth-router.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
async function fixture() {
  const state = { rows: [], failToken: false, valid: true };
  const module = { exports: {} };
  const user = { id: 'account', email: 'fixture@example.test', password: 'hash' };
  const imports = {
    bcrypt: { compare: async () => state.valid, hash: async () => 'hash' },
    jsonwebtoken: { sign() { if (state.failToken) throw Error('signing failed'); return 'synthetic-token'; } },
    '../config/database': { query: async sql => ({ rows: sql.startsWith('SELECT id') ? [] : [user] }) },
    '../utils/validation': { validateAuthInput: () => ({ valid: true }) },
    '../utils/loginEvents': { recordLoginEvent: async (...row) => state.rows.push(row) },
    crypto: require('node:crypto'), nodemailer: {},
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: id => { assert.ok(id in imports, id); return imports[id]; }, process: { env: { JWT_SECRET: 'fixture' } } });
  const routes = {};
  await module.exports.default({ post: (path, handler) => routes[path] = handler, get() {}, log: { error() {} } });
  return { state, request: async path => {
    const reply = { status: 200, code(n) { this.status = n; return this; }, send(body) { this.body = body; return this; } };
    await routes[path]({ body: { email: user.email, password: 'synthetic' } }, reply);
    return reply;
  } };
}
for (const path of ['/login', '/register']) {
  test(`${path}: token signing failure writes nothing`, async () => {
    const { state, request } = await fixture(); state.failToken = true;
    assert.equal((await request(path)).status, 500); assert.equal(state.rows.length, 0);
  });
  test(`${path}: successful issued token writes one event`, async () => {
    const { state, request } = await fixture();
    assert.equal((await request(path)).body.token, 'synthetic-token'); assert.equal(state.rows.length, 1);
  });
}
test('wrong credential writes nothing', async () => {
  const { state, request } = await fixture(); state.valid = false;
  assert.equal((await request('/login')).status, 401); assert.equal(state.rows.length, 0);
});
