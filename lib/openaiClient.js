const { ChatOpenAI} = require("@langchain/openai");
const { ConversationTokenBufferMemory } = require("langchain/memory");
const { RedisChatMessageHistory } = require("@langchain/community/stores/message/ioredis");
const { SESSION_MAX_AGE, redisClient } = require('../plugins');


if (!process.env.OPENAI_API_KEY) {
  console.error("CRITICAL: OPENAI_API_KEY is not set in the .env file. Application cannot start.");
  process.exit(1);
}
const DEFAULT_HISTORY_MAX_TOKENS = 2000;
const chatOptions = {
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.95,
    maxTokens: 1000,
    streaming: false,
    timeout: 60000,
    maxRetries: 3,
};
function getOpenAI(modelName) {
  const clientOptions = { ...chatOptions };
  if (modelName && modelName !== clientOptions.modelName) {
    clientOptions.modelName = modelName;
  }
  return new ChatOpenAI(clientOptions);
}

function getSessionMemory(sessionId, ai) {
  return new ConversationTokenBufferMemory({
    llm: ai,
    maxTokenLimit: DEFAULT_HISTORY_MAX_TOKENS,
    returnMessages: true,
    chatHistory: new RedisChatMessageHistory({
      sessionId: `chat:${sessionId}`,
      sessionTTL: Math.floor(SESSION_MAX_AGE / 1000),
      client: redisClient,
    }),
  });
}

module.exports = {
  getOpenAI,
  getSessionMemory
};
