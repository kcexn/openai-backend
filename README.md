# OpenAI Backend Template

A simple Node.js and Express.js backend template for interacting with the OpenAI API.

## Prerequisites

- Node.js (v16 or later recommended)
- npm (usually comes with Node.js)
- An OpenAI API Key

## Setup

1.  **Clone the repository (or create the files manually):**
    If this were a git repository, you would clone it. For now, create the files `package.json`, `.env`, `.gitignore`, and `index.js` as provided.

2.  **Install dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Configure your API Key:**
    Rename or copy the `.env.example` to `.env` (if you had an example, otherwise create `.env` directly).
    Open the `.env` file and replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key.
    ```
    OPENAI_API_KEY="sk-yourActualOpenAiApiKey"
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

## Example API Usage

You can send a POST request to the `/api/chat` endpoint with a JSON body containing a `prompt`.

**Example using cURL:**

```bash
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Explain quantum computing in simple terms"}'
```

You can also specify a model (defaults to `gpt-3.5-turbo`):

```bash
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"prompt": "Write a short poem about a cat", "model": "gpt-3.5-turbo"}'
```

The response will be the message content from the OpenAI API.
