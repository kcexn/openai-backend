# OpenAI Backend

A simple Node.js and Fastify backend for interacting with the OpenAI API, 
featuring session management and OpenAPI documentation.

## Prerequisites

- Node.js (v16 or later recommended)
- npm (usually comes with Node.js)
- An OpenAI API Key

## Setup

1.  **Clone the repository (or create the project files manually):**
    If this were a git repository, you would clone it. For now, create the files `package.json`, `.env`, `.gitignore`, and `index.js` as provided.

2.  **Install dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Configure your Environment Variables:**
    Rename or copy the `.env.example` to `.env` (if you had an example, otherwise create `.env` directly).
    Open the `.env` file and add your OpenAI API key and a session secret.
    ```
    OPENAI_API_KEY="sk-yourActualOpenAiApiKeyHere"
    SESSION_SECRET="yourStrongRandomSessionSecretHere"
    ```

## Running the Application

-   **For development (with auto-reloading using nodemon):**
    ```bash
    npm run dev
    ```
-   **For production:**
    ```bash
    npm start
    ```
The server will start, typically on `http://localhost:3000`.

## API Endpoints

### `/api/chat` (POST)

This endpoint allows you to interact with the OpenAI chat model. It maintains conversation context using server-side sessions, identified by a cookie sent to your browser/client.

**1. Start a new conversation (negotiate session):**
The very first request from a client will establish a new session on the server. The server will send back a `Set-Cookie` header containing a unique session identifier. You need to capture and store this cookie for subsequent requests.
```bash
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Hello, what is your name?"}' \
-c cookiejar.txt
```

You can also specify a model (defaults to `gpt-3.5-turbo`):

```bash
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Hello, what is your name?", "model": "gpt-3.5-turbo"}' \
-c cookiejar.txt
```

**2. Continue the conversation (use existing session):**
For all subsequent requests within the same conversation, you must send 
the saved session cookie back to the server. This allows the server to 
retrieve the correct conversation history from the session store.
```bash
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Tell me a joke about programming."}' \
-b cookiejar.txt
```

You can also specify the model.
```bash
curl -X POST http://localhost:3000api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Tell me a joke about programming.", "model": "gpt-3.5-turbo"}' \
-b cookiejar.txt
```
