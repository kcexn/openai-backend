module.exports = async function (app) {
  app.get('/', async (request, reply) => {
    return reply.send('OpenAI Backend Template with Fastify is running!');
  });
};
