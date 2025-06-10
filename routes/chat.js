const openai = require('../openaiClient'); // Adjusted path

const chatSchema = {
    description: 'Send a prompt to the OpenAI chat model and get a completion.',
    tags: ['OpenAI'],
    summary: 'Chat with OpenAI model',
    body: {
        type: 'object',
        required: ['prompt'],
        properties: {
            prompt: { type: 'string', description: 'The user prompt to send to the AI model.' },
            model: { type: 'string', description: 'The OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4).', default: 'gpt-3.5-turbo' }
        }
    },
    response: {
        200: {
            description: 'Successful response from OpenAI',
            type: 'object',
            properties: {
                role: { type: 'string', example: 'assistant' },
                content: { type: 'string', example: 'This is a response from the AI.' },
            }
        },
        400: {
            description: 'Bad Request - Prompt is required',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        },
        500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
                error: { type: 'string' },
                details: { type: 'string' }
            }
        }
    }
};

module.exports = async function (app) {
  app.post('/api/chat', { schema: chatSchema }, async (request, reply) => {
    try {
      const { prompt, model = 'gpt-3.5-turbo' } = request.body;

      if (!prompt) {
        reply.code(400).send({ error: 'Prompt is required' });
        return;
      }

      if (!request.session.messages) {
        request.session.messages = [];
      }
      if (request.session.messages.length === 0) {
        request.session.messages.push({
            role: 'system',
            content: 'You are an evil monster.'
        });
      }
      request.session.messages.push({ role: 'user', content: prompt });
      const completion = await openai.chat.completions.create({
        messages: request.session.messages,
        model: model,
      });

      request.session.messages.push(completion.choices[0].message);
      reply.send(completion.choices[0].message);
    } catch (error) {
      app.log.error('Error calling OpenAI:', error.message);
      reply.code(500).send({ error: 'Failed to communicate with OpenAI', details: error.message });
    }
  });
};
