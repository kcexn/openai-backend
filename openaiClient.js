const { ChatOpenAI} = require("@langchain/openai");

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
module.exports = openai;
