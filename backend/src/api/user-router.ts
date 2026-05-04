import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

async function requireAuth(request: any, reply: any) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return reply.code(401).send({ error: 'Yetkilendirme gerekli' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    request.user = decoded;
  } catch {
    return reply.code(401).send({ error: 'Geçersiz token' });
  }
}

export default async function userRouterRoutes(server: FastifyInstance) {
  server.get('/balance', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    try {
      const result = await query('SELECT balance FROM users WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
      }
      return reply.send({ balance: result.rows[0].balance });
    } catch (err: any) {
      server.log.error('Balance error:', err);
      return reply.code(500).send({ error: 'Sunucu hatası' });
    }
  });

  server.get('/generations', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    try {
      const result = await query(
        'SELECT * FROM generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
      );

      return reply.send({ generations: result.rows });
    } catch (err: any) {
      server.log.error('Generations error:', err);
      return reply.code(500).send({ error: 'Sunucu hatası' });
    }
  });

  server.post('/generations', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    const { resultUrl, model, prompt, cost } = request.body as any;

    try {
      const result = await query(
        'INSERT INTO generations (user_id, result_url, model, prompt, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, resultUrl, model, prompt, cost]
      );

      return reply.code(201).send({ generation: result.rows[0] });
    } catch (err: any) {
      server.log.error('Generation insert error:', err);
      return reply.code(500).send({ error: 'Kayıt hatası' });
    }
  });
}
