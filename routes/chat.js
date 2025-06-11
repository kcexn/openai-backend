const { openai, getSessionMemory } = require('../openaiClient');
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { randomUUID } = require('node:crypto');

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
      const { prompt, model = openai.model } = request.body;

      if (!prompt) {
        reply.code(400).send({ error: 'Prompt is required' });
        return;
      }

      let sessionUuid = request.session.sessionUuid;
      if (!sessionUuid) {
          sessionUuid = randomUUID();
          request.session.sessionUuid = sessionUuid;
      }

      const SYSTEM_MESSAGE = 'You are an evil monster.';
      const sessionMemory = getSessionMemory(sessionUuid);
      sessionMemory.maxTokenLimit = Math.max(openai.maxTokens-SYSTEM_MESSAGE.length, 100);
      
      const memoryVariables = await sessionMemory.loadMemoryVariables({});
      let currentMessages = [
        new SystemMessage(SYSTEM_MESSAGE),
        ...memoryVariables.history,
        new HumanMessage(prompt),
      ];
      const aiResponse = await openai.invoke(currentMessages, { model });
      await sessionMemory.saveContext({ input: prompt }, { output: aiResponse.content });
      reply.send({ role: 'assistant', content: aiResponse.content });
    } catch (error) {
      app.log.error('Error calling OpenAI:', error.message);
      reply.code(500).send({ error: 'Failed to communicate with OpenAI', details: error.message });
    }
  });
};
