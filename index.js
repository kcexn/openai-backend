require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const OpenAI = require('openai');
const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in the .env file.");
  process.exit(1);
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

fastify.get('/', async (request, reply) => {
  return 'OpenAI Backend Template with Fastify is running!';
});

fastify.post('/api/chat', async (request, reply) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo' } = request.body;

    if (!prompt) {
      reply.code(400);
      return { error: 'Prompt is required' };
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });
    return completion.choices[0].message;
  } catch (error) {
    fastify.log.error('Error calling OpenAI:', error.message);
    reply.code(500);
    return { error: 'Failed to communicate with OpenAI', details: error.message };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
