const fastifySwagger = require('@fastify/swagger');
const fastifySwaggerUI = require('@fastify/swagger-ui');
const fastifyCookie = require('@fastify/cookie');
const fastifySession = require('@fastify/session');
const fastifyCors = require('@fastify/cors');
const Redis = require('ioredis');
const { RedisStore } = require('connect-redis');

const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = 1000 * 60 * 30; // 30 minutes in milliseconds

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(REDIS_URL, {
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: REDIS_URL === 'redis://localhost:6379',
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function registerPlugins(app, port) {
  const productionUrl = process.env.PRODUCTION_URL;
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
  await app.register(fastifyCors, {
    origin: allowedOrigins,
    methods: ['POST', 'OPTIONS', 'GET', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'OpenAI API Proxy with Fastify',
        description: 'A Fastify proxy for interacting with the OpenAI API, with auto-generated OpenAPI documentation.',
        version: '0.1.0',
      },
      servers: process.env.NODE_ENV === 'production'
        ? (productionUrl ? [{ url: productionUrl, description: 'Production server' }] : [])
        : [{ url: `http://localhost:${port}`, description: 'Local development server' }],
      components: {},
      tags: [
        { name: 'OpenAI', description: 'Endpoints related to OpenAI services' },
      ],
    },
  });


  await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
      withCredentials: true,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) { next(); },
      preHandler: function (_request, _reply, next) { next(); },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => { return swaggerObject; },
    transformSpecificationClone: true,
  });

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: SESSION_SECRET,
    cookie: {
      name: 'sessionId',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      partitioned: true,
      path: '/',
    },
    rolling: true,
    saveUninitialized: false,
    store: new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: Math.floor(SESSION_MAX_AGE / 1000),
    }),
  });
}

module.exports = {
  registerPlugins,
  SESSION_MAX_AGE,
  redisClient,
};
