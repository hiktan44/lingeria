import { FastifyInstance } from 'fastify';

export function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(function (error: any, request, reply) {
    fastify.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    if (error.name === 'UnauthorizedError' || error.statusCode === 401) {
      return reply.code(401).send({ error: 'Yetkilendirme başarısız' });
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        error: error.message || 'Bad Request',
      });
    }

    return reply.code(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  });

  fastify.setNotFoundHandler(function (request, reply) {
    return reply.code(404).send({ error: 'Route bulunamadı', path: request.url });
  });
}
