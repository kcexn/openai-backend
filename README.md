# OpenAI Backend

A simple Node.js and Fastify backend for interacting with the OpenAI API, 
featuring chat history and OpenAPI documentation.

## Prerequisites

- Node.js (v16 or later recommended)
- npm (usually comes with Node.js)
- An OpenAI API Key
- Docker (for running Redis locally)

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
    Open the `.env` file and add your OpenAI API key, a session secret, and optionally the Redis URL.
    ```
    OPENAI_API_KEY="sk-yourActualOpenAiApiKeyHere"
    SESSION_SECRET="yourStrongRandomSessionSecretHere"
    REDIS_URL="redis://localhost:6379" # Default, if running Redis locally
    ```

4.  **Setup Redis for Session and Chat History Storage:**
    This application uses Redis to store session information and chat message history.
    You can use a cloud-based Redis provider or run it locally using Docker.

    **Running Redis with Docker (for development):**
    A `docker-compose.yml` file is provided to easily stand up a Redis container.
    
    a.  Make sure Docker and Docker Compose are installed.

    b.  In your project's root directory (where `docker-compose.yml` is located), run:
    ```bash
    docker-compose up -d
    ```
    This will start a Redis container named `dev-redis` in detached mode, 
    listening on port `6379`.
    The `REDIS_URL` in your `.env` file should match this (e.g., 
    `redis://localhost:6379`).

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

### `/chat` (POST)

This endpoint allows you to interact with the OpenAI chat model. It maintains conversation context using server-side sessions, identified by a cookie sent to your browser/client.

**1. Start a new conversation (negotiate session):**
The very first request from a client will establish a new session on the server. The server will send back a `Set-Cookie` header containing a unique session identifier. You need to capture and store this cookie for subsequent requests.
```bash
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Hello, what is your name?"}' \
-c cookiejar.txt
```

You can also specify a model (defaults to `gpt-3.5-turbo`):

```bash
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Hello, what is your name?", "model": "gpt-3.5-turbo"}' \
-c cookiejar.txt
```

**2. Continue the conversation (use existing session):**
For all subsequent requests within the same conversation, you must send 
the saved session cookie back to the server. This allows the server to 
retrieve the correct conversation history from the session store.
```bash
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Tell me a joke about programming."}' \
-b cookiejar.txt
```

You can also specify the model.
```bash
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Tell me a joke about programming.", "model": "gpt-3.5-turbo"}' \
-b cookiejar.txt
```
