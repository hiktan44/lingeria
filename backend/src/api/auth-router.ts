import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { validateAuthInput } from '../utils/validation';

export default async function authRouterRoutes(server: FastifyInstance) {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  server.post('/register', async (request, reply) => {
    const body = request.body as any;
    const validation = validateAuthInput(body);
    if (!validation.valid) {
      return reply.code(400).send({ error: 'Validation failed', details: validation.errors });
    }

    const { email, password } = body;

    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return reply.code(409).send({ error: 'Bu email zaten kayıtlı' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await query(
        'INSERT INTO users (email, password, balance) VALUES ($1, $2, $3) RETURNING id, email, balance',
        [email, hashedPassword, 100.0]
      );

      const newUser = result.rows[0];

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return reply.code(201).send({
        message: 'Kayıt başarılı',
        token,
        user: { id: newUser.id, email: newUser.email, balance: newUser.balance },
      });
    } catch (err: any) {
      server.log.error('Register error:', err);
      return reply.code(500).send({ error: 'Kayıt sırasında hata oluştu' });
    }
  });

  server.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email ve şifre gereklidir' });
    }

    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return reply.code(401).send({ error: 'Email veya şifre hatalı' });
      }

      const user = result.rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return reply.code(401).send({ error: 'Email veya şifre hatalı' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return reply.send({
        message: 'Giriş başarılı',
        token,
        user: { id: user.id, email: user.email, balance: user.balance },
      });
    } catch (err: any) {
      server.log.error('Login error:', err);
      return reply.code(500).send({ error: 'Sunucu hatası' });
    }
  });

  server.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.code(401).send({ error: 'Token gerekli' });
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const result = await query(
        'SELECT id, email, balance, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
      }

      return reply.send({ user: result.rows[0] });
    } catch (err: any) {
      server.log.error('Get user error:', err);
      return reply.code(401).send({ error: 'Geçersiz token' });
    }
  });
}
