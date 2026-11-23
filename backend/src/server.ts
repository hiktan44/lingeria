import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { dbConfig, initDatabase, query } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { clientIp } from './utils/rateLimit';
import { initCreditRefundRecovery } from './utils/creditRefund';

dotenv.config();

const server = fastify({ 
  logger: true,
  bodyLimit: 50 * 1024 * 1024
});

// Error handler
errorHandler(server);

// Security plugins
server.register(helmet);

server.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});

// Rate limiting
// keyGenerator: gerçek istemci IP'si (bkz. utils/rateLimit.ts). Varsayılan
// request.ip, Next.js vekilinin adresi olduğundan tüm kullanıcılar tek sayacı
// paylaşıyordu (tek istemci herkesi 429'a düşürebiliyordu).
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: clientIp,
  errorResponseBuilder: function (request, context) {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Lütfen bekleyin, limit aşıldı.'
    };
  }
});

// Health Check
server.get('/health', async (request, reply) => {
  return reply.send({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Import routes
import aiRouterRoutes from './api/ai-router';
import authRouterRoutes from './api/auth-router';
import userRouterRoutes from './api/user-router';

// Register routes
server.register(authRouterRoutes, { prefix: '/api/v1/auth' });
server.register(userRouterRoutes, { prefix: '/api/v1/user' });
server.register(aiRouterRoutes, { prefix: '/api/v1/ai' });

server.get('/api/v1', async (request, reply) => {
  return { message: 'LingeriaFasheone API is running', dbConnected: dbConfig.connected };
});

export { server };

if (require.main === module) {
  const start = async () => {
    try {
      await initDatabase();
      await initCreditRefundRecovery(query, server.log);
      const port = Number(process.env.PORT) || 4000;
      await server.listen({ port, host: '0.0.0.0' });
      server.log.info(`Server running at http://localhost:${port}`);
      server.log.info(`Database connected: ${dbConfig.connected}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };
  start();
}
