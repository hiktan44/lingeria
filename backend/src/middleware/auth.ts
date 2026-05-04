import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({ error: 'Yetkilendirme header\'ı eksik' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === 'your-secret-key') {
    return reply.code(500).send({ error: 'JWT_SECRET yapılandırılmamış' });
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    request.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}
