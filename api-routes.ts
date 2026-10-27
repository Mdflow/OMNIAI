import express, { Router } from 'express';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const router = Router();
router.use(express.json({ limit: '25mb' }));

// Chat is backed by an OpenAI-compatible API (OpenRouter). The API key is supplied by the
// user in the app and sent with each request; the server proxies it to the provider.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// The app's model personas are system-prompt modes. All map to one capable, widely-available,
// vision-capable OpenRouter model so any valid key works without per-model setup.
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const MODEL_MAP: Record<string, string> = {
  'gemini-3.6-flash': OPENROUTER_MODEL,
  'gemini-3.5-flash': OPENROUTER_MODEL,
  'gemini-3.6-flash-creative': OPENROUTER_MODEL,
  'gemini-3.6-flash-coder': OPENROUTER_MODEL,
  'gemini-3.8-flash': OPENROUTER_MODEL,
  'gemini-3.8-flash-creative': OPENROUTER_MODEL,
  'gemini-3.8-flash-coder': OPENROUTER_MODEL,
  'gemini-3.8-flash-thinking': OPENROUTER_MODEL,
};

// Helper to handle both /api/* and direct /* routing
const routes = [
  '/health',
  '/api/health',
  '/.netlify/functions/api/health',
];

router.get(routes, (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
  });
});

// API key status endpoint used by the Settings modal. The key is supplied by the user and
// verified with a 1-token OpenRouter call so the UI can tell "missing" from "rejected".
const keyStatusRoutes = [
  '/key-status',
  '/api/key-status',
  '/.netlify/functions/api/key-status',
];

router.post(keyStatusRoutes, async (_req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    res.json({ configured: false, valid: false });
    return;
  }

  const keyPreview = `...${apiKey.slice(-4)}`;
  const source = 'OpenRouter';

  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });

    if (r.ok) {
      res.json({ configured: true, valid: true, source, keyPreview });
      return;
    }

    let errorMsg = `OpenRouter responded with status ${r.status}`;
    try {
      const data = await r.json();
      errorMsg = data?.error?.message || data?.error || errorMsg;
    } catch {}
    res.json({ configured: true, valid: false, source, keyPreview, error: errorMsg });
  } catch (err: any) {
    res.json({
      configured: true,
      valid: false,
      source,
      keyPreview,
      error: err?.message || 'Could not contact OpenRouter to verify the API key.',
    });
  }
});

const modelRoutes = [
  '/models',
  '/api/models',
  '/.netlify/functions/api/models',
];

router.get(modelRoutes, (_req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.6-flash',
        displayName: 'GPT-4o (Gemini 3.6 Flash)',
        description: 'Ultra-fast, responsive intelligence for text, coding, and vision analysis.',
        badge: 'Recommended ⚡',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.5-flash',
        displayName: 'o1 Reasoning (Deep Think)',
        description: 'Advanced reasoning and step-by-step logic for complex math and problems.',
        badge: 'Reasoning',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.6-flash-creative',
        displayName: 'Creative & Prose Mode',
        description: 'Optimized for storytelling, engaging dialogue, and creative writing.',
        badge: 'Creative',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.6-flash-coder',
        displayName: 'Code Architect Mode',
        description: 'Specialized for writing clean code, refactoring, and debugging.',
        badge: 'Coding',
        contextLimit: '128k',
        supportsVision: true,
      },
    ],
  });
});

// Proxy endpoint to browse any website without navigating away
const proxyBrowseRoutes = [
  '/proxy/browse',
  '/api/proxy/browse',
  '/.netlify/functions/api/proxy/browse',
];

router.get(proxyBrowseRoutes, async (req, res) => {
  let targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('URL query parameter is required');
    return;
  }

  targetUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const finalUrl = response.url || targetUrl;

    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();

    $('base').remove();
    $('head').prepend(`<base href="${finalUrl}" target="_self">`);

    const injectionScript = `
      <script>
        (function() {
          try {
            window.top = window.self;
            window.parent = window.self;
          } catch(e) {}

          document.addEventListener('click', function(e) {
            var target = e.target;
            var anchor = target.closest('a');
            if (anchor && anchor.href) {
              var href = anchor.href;
              if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
              if (href.startsWith('#')) return;

              e.preventDefault();
              e.stopPropagation();

              try {
                window.parent.postMessage({ type: 'OMNICHAT_NAVIGATE', url: href }, '*');
              } catch(err) {}

              window.location.href = '/api/proxy/browse?url=' + encodeURIComponent(href);
            }
          }, true);
        })();
      </script>
    `;
    $('head').append(injectionScript);

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        try {
          const resolved = new URL(href, finalUrl).href;
          $(el).attr('href', `/api/proxy/browse?url=${encodeURIComponent(resolved)}`);
          $(el).attr('target', '_self');
        } catch {}
      }
    });

    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Proxy-Target-Url', finalUrl);
    res.send($.html());
  } catch (error: any) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #18181b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { max-width: 480px; text-align: center; background: #27272a; padding: 32px; border-radius: 16px; border: 1px solid #3f3f46; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #f87171; margin-top: 0; font-size: 20px; }
            p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
            .url { word-break: break-all; color: #38bdf8; font-family: monospace; font-size: 12px; margin: 12px 0; background: #1e1e24; padding: 8px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Unable to load webpage</h2>
            <p>Could not connect to the requested website:</p>
            <div class="url">${targetUrl}</div>
            <p style="font-size: 12px; color: #71717a;">${error?.message || 'Check if the URL is correct or if the host permits connections.'}</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Proxy content extract endpoint
const proxyExtractRoutes = [
  '/proxy/extract',
  '/api/proxy/extract',
  '/.netlify/functions/api/proxy/extract',
];

router.get(proxyExtractRoutes, async (req, res) => {
  let targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'URL query parameter is required' });
    return;
  }

  targetUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || targetUrl;
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';
    const favicon =
      $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';

    $('script, style, noscript, nav, footer, iframe, svg, [role="banner"], [role="navigation"]').remove();

    let mainContent = $('article, main, [role="main"]').text().trim();
    if (!mainContent || mainContent.length < 100) {
      mainContent = $('body').text().trim();
    }
    const cleanContent = mainContent.replace(/\s+/g, ' ').slice(0, 15000);

    let resolvedFavicon = '';
    if (favicon) {
      try {
        resolvedFavicon = new URL(favicon, targetUrl).href;
      } catch {}
    }

    res.json({
      url: response.url || targetUrl,
      title,
      description,
      favicon: resolvedFavicon,
      content: cleanContent,
      wordCount: cleanContent.split(' ').filter(Boolean).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract content' });
  }
});

// Chat stream endpoint
const chatStreamRoutes = [
  '/chat/stream',
  '/api/chat/stream',
  '/.netlify/functions/api/chat/stream',
];

router.post(chatStreamRoutes, async (req, res) => {
  const {
    messages,
    modelId = 'gemini-3.8-flash',
    systemInstruction = '',
    customInstructions = '',
    webSearch = false,
  } = req.body;

  const serverKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!serverKey) {
    res.status(500).json({
      error: 'No OpenRouter API key is configured on the server. Set OPENROUTER_API_KEY.',
    });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  try {
    let combinedSystem = `You are ChatGPT, a large language model trained by OpenAI (embodied here with state-of-the-art AI intelligence).
You provide helpful, insightful, accurate, and markdown-formatted answers.
Format code with markdown triple-backticks with syntax identifiers.
When asked mathematical problems or reasoning, provide structured, clear explanations.
Tone should be polite, authentic, knowledgeable, and responsive.`;

    if (modelId === 'gemini-3.8-flash-coder' || modelId === 'gemini-3.6-flash-coder') {
      combinedSystem += `\nYou are operating in Code Architect Mode. Focus on high quality, production-ready, clean, well-documented code with unit tests, best practices, and concise technical explanations.`;
    } else if (modelId === 'gemini-3.8-flash-creative' || modelId === 'gemini-3.6-flash-creative') {
      combinedSystem += `\nYou are operating in Creative & Prose Mode. Emphasize vivid descriptions, nuanced tone, captivating narrative voice, and thoughtful style.`;
    }

    if (systemInstruction) {
      combinedSystem += `\n\nSpecific task guidance: ${systemInstruction}`;
    }
    if (customInstructions) {
      combinedSystem += `\n\nUser Custom Instructions: ${customInstructions}`;
    }

    // Filter out empty placeholder messages
    const validMessages = messages.filter((msg: any) => {
      const hasContent = Boolean(msg.content && String(msg.content).trim().length > 0);
      const hasImage = Boolean(msg.image && msg.image.data);
      return hasContent || hasImage;
    });

    if (validMessages.length === 0) {
      res.status(400).json({ error: 'No valid message provided in request.' });
      return;
    }

    // Build OpenAI-compatible messages (system + turns). Images become image_url parts.
    const chatMessages: any[] = [{ role: 'system', content: combinedSystem }];

    for (const msg of validMessages) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user';

      if (msg.image && msg.image.data && msg.image.mimeType) {
        let rawBase64 = msg.image.data;
        if (rawBase64.includes('base64,')) {
          rawBase64 = rawBase64.split('base64,')[1];
        }
        const dataUrl = `data:${msg.image.mimeType};base64,${rawBase64}`;
        const parts: any[] = [{ type: 'image_url', image_url: { url: dataUrl } }];
        if (msg.content) {
          parts.push({ type: 'text', text: String(msg.content) });
        }
        chatMessages.push({ role, content: parts });
      } else {
        chatMessages.push({ role, content: String(msg.content || '') });
      }
    }

    // Ensure the conversation ends with a user turn.
    while (chatMessages.length > 1 && chatMessages[chatMessages.length - 1].role === 'assistant') {
      chatMessages.pop();
    }
    if (chatMessages.length <= 1) {
      res.status(400).json({ error: 'Request must end with a user turn.' });
      return;
    }

    let model = MODEL_MAP[modelId] || OPENROUTER_MODEL;
    // OpenRouter enables web search via the ":online" model suffix.
    if (webSearch && !model.endsWith(':online')) {
      model = `${model}:online`;
    }

    // Streaming upstream request. NOTE: in this bun runtime the response headers must NOT
    // be flushed before the outbound fetch (it hangs the body drain), and Node-style
    // req.on('close') fires immediately, so we do not use an isAborted guard here.
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
      }),
    });

    // Set SSE headers only after the upstream call completes: flushing response headers
    // before an outbound fetch hangs the fetch body drain in this bun runtime.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!upstream.ok || !upstream.body) {
      let errorMsg = `OpenRouter responded with status ${upstream.status}`;
      try {
        const errData = await upstream.json();
        errorMsg = errData?.error?.message || errData?.error || errorMsg;
      } catch {}
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content || '';
          if (delta) {
            res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
          }
          if (parsed?.error) {
            res.write(`data: ${JSON.stringify({ error: parsed.error.message || 'Stream error.' })}\n\n`);
          }
        } catch {
          // Ignore non-JSON keepalive lines.
        }
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error during chat completion:', error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      const errorMsg = error?.message || 'An error occurred while generating the response.';
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

export default router;
