module.exports = async function (app) {
  app.get('/', async (_request, reply) => {
    return reply.send('OpenAI Backend Template with Fastify is running!');
  });
};
