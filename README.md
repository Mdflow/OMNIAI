# OmniChat - ChatGPT Experience & In-App Web Browser

A conversational AI web application inspired by ChatGPT with real-time streaming, multimodal image analysis, customizable models, in-app web browsing, and chat management.

---

## 🔑 API Key Configuration

The app talks to any provider that exposes an **OpenAI-compatible chat completions API** — OpenAI, OpenRouter, Groq, Together, DeepSeek, xAI, Mistral, a local Ollama / LM Studio server, or Google's own OpenAI-compatible endpoint. You supply one key plus, optionally, the provider's base URL and model.

### 1. Get an API Key

Sign up with any OpenAI-compatible provider and copy its key, for example:

* **OpenAI** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
* **OpenRouter** (a single key usable with hundreds of models) — [openrouter.ai/keys](https://openrouter.ai/keys)
* **Groq** — [console.groq.com/keys](https://console.groq.com/keys)
* **Google Gemini** (through its OpenAI-compatible API) — [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

### 2. Local Setup (Running on your computer)

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd <your-repo-folder>
   ```

2. **Create your `.env` file:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Add your provider settings:**
   Open the `.env` file in your code editor and set:
   ```env
   AI_API_KEY=your_provider_api_key_here
   # Optional — these are the defaults:
   AI_BASE_URL=https://api.openai.com/v1
   AI_MODEL=gpt-4o-mini
   # Optional — extra models offered in the app's model picker:
   AI_MODELS=openai/gpt-4o-mini,openai/gpt-4o
   PORT=3000
   ```
   Common base URLs:
   * OpenAI — `https://api.openai.com/v1`
   * OpenRouter — `https://openrouter.ai/api/v1`
   * Groq — `https://api.groq.com/openai/v1`
   * Google Gemini — `https://generativelanguage.googleapis.com/v1beta/openai`
   * Local Ollama — `http://localhost:11434/v1`

4. **Install dependencies and start the app:**
   ```bash
   npm install
   npm run dev
   ```

5. **Open in your browser:**
   Visit [http://localhost:3000](http://localhost:3000).

---

### 3. Deploying to Netlify (Get a `.netlify.app` domain)

This project includes pre-configured **`netlify.toml`** and serverless function support for Netlify!

1. **Push your code to GitHub** (via AI Studio's **Export / Push to GitHub** button).
2. Go to [Netlify](https://app.netlify.com) and log in.
3. Click **"Add new site"** → **"Import an existing project"**.
4. Select **GitHub** and choose your repository.
5. Netlify will automatically detect the settings from `netlify.toml`:
   * **Build command:** `npm run build`
   * **Publish directory:** `dist`
   * **Functions directory:** `netlify/functions`
6. Click **"Environment variables"** (or go to **Site configuration > Environment variables**) and add:
   * **Key:** `AI_API_KEY` — **Value:** *(your provider API key)*
   * Add `AI_BASE_URL` and `AI_MODEL` as well if you are not using the OpenAI defaults.
7. Click **"Deploy site"**.
8. Once deployed, Netlify assigns you a free URL like:
   `https://random-name-123.netlify.app`
9. **Change the subdomain name:**
   * In your Netlify dashboard, go to **Site configuration** → **Change site name**.
   * Type your preferred name (e.g., `my-omnichat.netlify.app`).

---

### 4. Deploying to Other Cloud Hosts (Vercel, Render, Railway, Cloud Run)

If you prefer other platforms:

* **Base44 / Vercel / Render / Railway**:
  1. Export / Push your repository to **GitHub**.
  2. In your **Base44** or hosting dashboard, connect your GitHub account and import this repository.
  3. Set the **Build Command** to `npm run build` and **Start Command** to `npm start`.
  4. In **Environment Variables**, set:
     * **Key:** `AI_API_KEY` — **Value:** *(your provider API key)*
     * Plus `AI_BASE_URL` / `AI_MODEL` when not using OpenAI.
  5. Deploy and attach your Base44 custom domain or default project URL!

* **Google Cloud Run / Docker**:
  Set the environment variables when deploying:
  ```bash
  --set-env-vars AI_API_KEY="your_api_key_here",AI_BASE_URL="https://api.openai.com/v1",AI_MODEL="gpt-4o-mini"
  ```

---

## 🚀 Features

* **Real-Time Token Streaming**: High-speed conversational responses via Server-Sent Events (SSE).
* **Bring Your Own Model**: The model picker lists whatever you configure through `AI_MODEL` / `AI_MODELS`, served by any OpenAI-compatible provider.
* **In-App Web Browser**:
  * Enter any website link and browse seamlessly without leaving the site.
  * Server proxy strips `X-Frame-Options` and CSP framing blocks.
  * Reader mode for clean article extraction.
  * Side-by-side AI page companion to summarize and answer questions about any webpage.
* **Multimodal Image Support**: Attach photos, diagrams, or screenshots for analysis (with vision-capable models).
* **Chat Management**: Grouped chat history (Today, Yesterday, 7 Days), search, renaming, pinning, and local persistence.
* **Export & Sharing**: Export chats to Markdown (`.md`) or JSON (`.json`), or copy formatted text.
* **Voice Capabilities**: Speech-to-text dictation and text-to-speech read aloud.
* **Dark / Light Modes**: Full aesthetic parity with ChatGPT styling.
