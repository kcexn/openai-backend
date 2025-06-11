const openai = require('../openaiClient');
const { ConversationTokenBufferMemory } = require("langchain/memory");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");
const { SESSION_MAX_AGE } = require('../plugins');
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

const CLEANUP_INTERVAL = Math.max(SESSION_MAX_AGE/10, 1000*60*5);
const sessionHistories = new Map();

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [sessionId, data] of sessionHistories.entries()) {
    if (data.expiresAt < now) {
      sessionHistories.delete(sessionId);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`[ChatHistoryCleanup] Removed ${cleanedCount} expired chat histories.`);
  }
}, CLEANUP_INTERVAL);

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

      const newExpiresAt = Date.now() + SESSION_MAX_AGE;
      let sessionHistoryData = sessionHistories.get(sessionUuid);
      let sessionMemory;
      
      if (sessionHistoryData) {
        sessionMemory = sessionHistoryData.memory;
        sessionHistories.set(sessionUuid, { memory: sessionMemory, expiresAt: newExpiresAt });
      } else {
        sessionMemory = new ConversationTokenBufferMemory({
            llm: openai,
            maxTokenLimit: openai.maxTokens,
            returnMessages: true
        });
        await sessionMemory.chatHistory.addMessage(new SystemMessage("You are an evil monster."));
        sessionHistories.set(sessionUuid, { memory: sessionMemory, expiresAt: newExpiresAt });
      }

      const memoryVariables = await sessionMemory.loadMemoryVariables({});
      let currentMessages = memoryVariables.history || [];
      if (!Array.isArray(currentMessages)) {
        currentMessages = [];
      }
      currentMessages.push(new HumanMessage(prompt));
      const aiResponse = await openai.invoke(currentMessages, { model });
      await sessionMemory.saveContext({ input: prompt }, { output: aiResponse.content });
      reply.send({ role: 'assistant', content: aiResponse.content });
    } catch (error) {
      app.log.error('Error calling OpenAI:', error.message);
      reply.code(500).send({ error: 'Failed to communicate with OpenAI', details: error.message });
    }
  });
};
