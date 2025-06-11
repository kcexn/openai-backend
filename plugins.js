const fastifySwagger = require('@fastify/swagger');
const fastifySwaggerUI = require('@fastify/swagger-ui');
const fastifyCookie = require('@fastify/cookie');
const fastifySession = require('@fastify/session');

const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = 1000 * 60 * 30; // 30 minutes in milliseconds


async function registerPlugins(app, port) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'OpenAI API Proxy with Fastify',
        description: 'A Fastify proxy for interacting with the OpenAI API, with auto-generated OpenAPI documentation.',
        version: '0.1.0'
      },
      servers: [{ url: `http://localhost:${port}`, description: 'Local server' }],
      components: {},
      tags: [
        { name: 'OpenAI', description: 'Endpoints related to OpenAI services' }
      ]
    }
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next(); },
      preHandler: function (request, reply, next) { next(); }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => { return swaggerObject; },
    transformSpecificationClone: true
  });

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: SESSION_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: SESSION_MAX_AGE
    },
    rolling: true, // Reset the session cookie's maxAge on every response
    saveUninitialized: false,
    // store: new SomePersistentStore()
  });
}

module.exports = {
    registerPlugins,
    SESSION_MAX_AGE
};
