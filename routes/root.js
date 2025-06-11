module.exports = async function (app) {
  app.get('/', async (request, reply) => {
    reply.send('OpenAI Backend Template with Fastify is running!');
  });
};
