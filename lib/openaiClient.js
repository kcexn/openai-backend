const { ChatOpenAI} = require("@langchain/openai");
const { ConversationTokenBufferMemory } = require("langchain/memory");
const { SESSION_MAX_AGE } = require('../plugins');

if (!process.env.OPENAI_API_KEY) {
  console.error("CRITICAL: OPENAI_API_KEY is not set in the .env file. Application cannot start.");
  process.exit(1);
}

const openai = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.95,
    maxTokens: 1000,
    streaming: false,
    timeout: 60000,
    maxRetries: 3,
});

const CLEANUP_INTERVAL = Math.max(SESSION_MAX_AGE / 10, 1000 * 60 * 5);
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
    console.log(`[ChatHistoryCleanup] Removed ${cleanedCount} expired chat histories from openaiClient.`);
  }
}, CLEANUP_INTERVAL);

function getSessionMemory(sessionId) {
  const newExpiresAt = Date.now() + SESSION_MAX_AGE;
  let sessionHistoryData = sessionHistories.get(sessionId);
  let sessionMemoryInstance;

  if (sessionHistoryData) {
    sessionMemoryInstance = sessionHistoryData.memory;
    sessionHistories.set(sessionId, { memory: sessionMemoryInstance, expiresAt: newExpiresAt });
  } else {
    sessionMemoryInstance = new ConversationTokenBufferMemory({
      llm: openai,
      maxTokenLimit: openai.maxTokens,
      returnMessages: true,
    });
    sessionHistories.set(sessionId, { memory: sessionMemoryInstance, expiresAt: newExpiresAt });
  }
  return sessionMemoryInstance;
}

module.exports = {
  openai, // The ChatOpenAI instance
  getSessionMemory,
};
