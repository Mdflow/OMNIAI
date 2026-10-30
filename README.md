# OmniChat - ChatGPT Experience & In-App Web Browser

A conversational AI web application inspired by ChatGPT with real-time streaming, multimodal image analysis, customizable models, in-app web browsing, and chat management.

---

## 🔑 APIMyLlama Configuration

Chat uses a server-managed APIMyLlama key shared across visitors. Configure these variables in Netlify under **Project configuration → Environment variables**, available to Functions:

- `APIMYLlama_API_key`: your APIMyLlama key, entered directly in the hosting dashboard.
- `APIMYLLAMA_CHAT_URL`: the provider's full HTTPS OpenAI-compatible chat completions endpoint.
- `APIMYLLAMA_MODEL`: a model identifier supported by your provider account.

The provider's endpoint, authentication protocol, and model identifiers still need verification against its documentation. The integration expects Bearer authentication, OpenAI-compatible messages, and SSE streaming. It does not assume an endpoint or model based on the provider name.

Delete the previous provider's environment variable from the hosting dashboard once you configure the replacement. Redeploy after changing environment variables. Never commit credentials or expose them through `VITE_` variables. Settings → Check Status verifies the server configuration without showing any part of the key.

For local development, copy `.env.example` to `.env`, fill in the three variables, install dependencies, and run `npm run dev`. The app serves on port 3000.

Web search has no configured APIMyLlama integration; turn it off when chatting. Image inputs require a model that supports OpenAI-compatible image messages.

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
