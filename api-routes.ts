import express, { Router } from 'express';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const router = Router();
router.use(express.json({ limit: '25mb' }));

// Provider-agnostic AI configuration. Any service that speaks the OpenAI-compatible
// chat completions API works here: OpenAI, OpenRouter, Groq, Together, DeepSeek, xAI,
// Mistral, Ollama/LM Studio, Google's OpenAI-compatible endpoint, and so on.
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const AI_DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Models offered in the UI: the default model first, then anything listed in AI_MODELS.
const AI_MODELS = [
  ...new Set([
    AI_DEFAULT_MODEL,
    ...(process.env.AI_MODELS || '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean),
  ]),
];

const resolveModel = (requested?: string) =>
  requested && AI_MODELS.includes(requested) ? requested : AI_DEFAULT_MODEL;

// Helper to handle both /api/* and direct /* routing
const routes = [
  '/health',
  '/api/health',
  '/.netlify/functions/api/health',
];

router.get(routes, (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(AI_API_KEY),
    model: AI_DEFAULT_MODEL,
    timestamp: new Date().toISOString(),
  });
});

const modelRoutes = [
  '/models',
  '/api/models',
  '/.netlify/functions/api/models',
];

router.get(modelRoutes, (_req, res) => {
  res.json({
    models: AI_MODELS.map((id, index) => ({
      id,
      displayName: id,
      description: '',
      badge: index === 0 ? 'Default' : '',
      contextLimit: '',
      supportsVision: true,
    })),
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
  if (!AI_API_KEY) {
    res.status(500).json({
      error:
        'AI_API_KEY is missing. Add the API key of any OpenAI-compatible AI provider in Secrets, and set AI_BASE_URL / AI_MODEL if you are not using the OpenAI defaults.',
    });
    return;
  }

  const {
    messages,
    modelId,
    systemInstruction = '',
    customInstructions = '',
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Detect a client that disconnects mid-generation. This must watch the *response*:
  // since Node 16 the request's own 'close' event fires as soon as the request body has
  // been read, which would mark every request as aborted and leave the stream open forever.
  let isAborted = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  try {
    let combinedSystem = `You are ChatGPT, a large language model trained by OpenAI (embodied here with state-of-the-art AI intelligence).
You provide helpful, insightful, accurate, and markdown-formatted answers.
Format code with markdown triple-backticks with syntax identifiers.
When asked mathematical problems or reasoning, provide structured, clear explanations.
Tone should be polite, authentic, knowledgeable, and responsive.`;

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

    const providerMessages = validMessages.map((msg: any) => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user';
      const hasImage = Boolean(msg.image && msg.image.data && msg.image.mimeType);

      if (!hasImage) {
        return { role, content: String(msg.content ?? '') };
      }

      const parts: any[] = [];
      if (msg.content) {
        parts.push({ type: 'text', text: String(msg.content) });
      }
      parts.push({
        type: 'image_url',
        image_url: {
          url: String(msg.image.data).includes('base64,')
            ? String(msg.image.data)
            : `data:${msg.image.mimeType};base64,${msg.image.data}`,
        },
      });

      return { role, content: parts };
    });

    // Providers expect the conversation to end with a user turn.
    while (providerMessages.length > 0 && providerMessages[providerMessages.length - 1].role === 'assistant') {
      providerMessages.pop();
    }

    if (providerMessages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Request must end with a user turn.' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: resolveModel(modelId),
        stream: true,
        messages: [{ role: 'system', content: combinedSystem }, ...providerMessages],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const raw = await upstream.text().catch(() => '');
      let detail = raw;
      try {
        const body = JSON.parse(raw);
        detail = body?.error?.message || body?.message || raw;
      } catch {
        // Not JSON — keep the raw body.
      }
      throw new Error(`${upstream.status} ${upstream.statusText}${detail ? ` — ${detail}` : ''}`.trim());
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!isAborted) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const chunk = JSON.parse(payload);
          const delta = chunk?.choices?.[0]?.delta?.content;
          const text = Array.isArray(delta)
            ? delta.map((part: any) => part?.text || '').join('')
            : delta;
          if (text && !isAborted) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch {
          // Ignore partial or non-JSON frames.
        }
      }
    }

    if (!isAborted) {
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Error during streaming:', error);
    if (!isAborted) {
      const errorMsg = error?.message || 'An error occurred while generating the response.';
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

export default router;
