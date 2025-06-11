const openai = require('../openaiClient');
const { ChatMessageHistory } = require("langchain/memory");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");
const { randomUUID } = require('crypto');
const { SESSION_MAX_AGE } = require('../plugins');

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
const chatHistories = new Map();

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [sessionId, data] of chatHistories.entries()) {
    if (data.expiresAt < now) {
      chatHistories.delete(sessionId);
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
      const { prompt, model = 'gpt-3.5-turbo' } = request.body;

      if (!prompt) {
        reply.code(400).send({ error: 'Prompt is required' });
        return;
      }

      let sessionId = request.session.sessionId;
      if (!sessionId) {
        sessionId = randomUUID();
        request.session.sessionId = sessionId;
      }

      const newExpiresAt = Date.now() + SESSION_MAX_AGE;
      let sessionHistoryData = chatHistories.get(sessionId);
      let chatHistory;
      
      if (sessionHistoryData) {
        chatHistory = sessionHistoryData.history;
        chatHistories.set(sessionId, { history: chatHistory, expiresAt: newExpiresAt });
      } else {
        chatHistory = new ChatMessageHistory();
        await chatHistory.addMessage(new SystemMessage('You are an evil monster.'));
        chatHistories.set(sessionId, { history: chatHistory, expiresAt: newExpiresAt });
      }
      await chatHistory.addMessage(new HumanMessage(prompt));

      const messagesForOpenAI = (await chatHistory.getMessages()).map(msg => {
        let role;
        const type = msg.getType();
        if (type === 'human') {
            role = 'user';
        } else if (type === 'ai') {
            role = 'assistant';
        } else if (type === 'system') {
            role = 'system';
        } else {
          app.log.warn(`Unknown LangChain message type: ${type}, defaulting to 'user'`);
          role = 'user';
        }
        return { role: role, content: msg.content };
      });
      const completion = await openai.chat.completions.create({
        messages: messagesForOpenAI,
        model: model,
      });

      const aiResponse = completion.choices[0].message;
      await chatHistory.addMessage(new AIMessage(aiResponse.content));
      reply.send(completion.choices[0].message);
    } catch (error) {
      app.log.error('Error calling OpenAI:', error.message);
      reply.code(500).send({ error: 'Failed to communicate with OpenAI', details: error.message });
    }
  });
};
