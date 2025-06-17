const { HumanMessage } = require("@langchain/core/messages");
const { getOpenAI, getSessionMemory } = require('../../lib/openaiClient');

const schema = {
    description: 'Get messages belonging to this chat session.',
    tags: ['OpenAI'],
    summary: 'Chat with OpenAI model',
    response: {
        200: {
            description: 'Successful response from OpenAI',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    role: { type: 'string' },
                    content: { type: 'string' }
                }
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
  app.get('/chat', { schema }, async (request, reply) => {
    try {
      let sessionUuid = request.session.sessionUuid;
      if (!sessionUuid) {
          return reply.send([]);
      }
      const ai = getOpenAI();
      const sessionMemory = getSessionMemory(sessionUuid, ai);
      const memoryVariables = await sessionMemory.loadMemoryVariables({});
      const messages = [...memoryVariables.history.map(
        (msg) => { 
          return {
            role: msg instanceof HumanMessage ? 'user' : 'assistant',
            content: msg.content
          };
        }
      )];
      return reply.send(messages);
    } catch (error) {
      app.log.error('Error retrieving chat history.', error.message);
      return reply.code(500).send({ error: 'Failed to retrieve chat history.', details: error.message });
    }
  });
};
