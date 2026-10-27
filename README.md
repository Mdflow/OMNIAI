# OmniChat - ChatGPT Experience & In-App Web Browser

A conversational AI web application inspired by ChatGPT with real-time streaming, multimodal image analysis, customizable models, in-app web browsing, and chat management.

---

## 🔑 API Key Configuration

When you clone or deploy this project, you need to provide an **OpenRouter API Key**. The key is used server-side and shared across all visitors.

### 1. Get an OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/keys).
2. Sign in and click **Create Key**.
3. Copy your key (starts with `sk-or-v1-`).

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

3. **Add your OpenRouter API Key:**
   Open the `.env` file in your code editor and set:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   PORT=3000
   ```

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
   * **Key:** `OPENROUTER_API_KEY`
   * **Value:** *(paste your OpenRouter API key from https://openrouter.ai/keys)*
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
     * **Key:** `OPENROUTER_API_KEY`
     * **Value:** *(your OpenRouter API key from https://openrouter.ai/keys)*
  5. Deploy and attach your Base44 custom domain or default project URL!

* **Google Cloud Run / Docker**:
  Set the environment variable when deploying:
  ```bash
  --set-env-vars OPENROUTER_API_KEY="your_api_key_here"
  ```

---

## 🚀 Features

* **Real-Time Token Streaming**: High-speed conversational responses via Server-Sent Events (SSE).
* **Multiple Model Personas**:
  * **GPT-4o (Omni)**: Everyday versatile intelligence and multimodal vision.
  * **o1 Reasoning**: Step-by-step logic and mathematical thinking.
  * **Code Architect**: Clean code generation, refactoring, and debugging.
  * **Creative & Prose**: Storytelling, marketing copy, and dialogue.
* **In-App Web Browser**:
  * Enter any website link and browse seamlessly without leaving the site.
  * Server proxy strips `X-Frame-Options` and CSP framing blocks.
  * Reader mode for clean article extraction.
  * Side-by-side AI page companion to summarize and answer questions about any webpage.
* **Multimodal Image Support**: Attach photos, diagrams, or screenshots for analysis.
* **Chat Management**: Grouped chat history (Today, Yesterday, 7 Days), search, renaming, pinning, and local persistence.
* **Export & Sharing**: Export chats to Markdown (`.md`) or JSON (`.json`), or copy formatted text.
* **Voice Capabilities**: Speech-to-text dictation and text-to-speech read aloud.
* **Dark / Light Modes**: Full aesthetic parity with ChatGPT styling.
