import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI server-side with telemetry User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey.length > 0),
    timestamp: new Date().toISOString(),
  });
});

// Model list endpoint
app.get('/api/models', (_req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.8-flash',
        displayName: 'GPT-4o (Gemini 3.8 Flash)',
        description: 'Our most intelligent, fast, and balanced model for everyday tasks.',
        badge: 'Recommended',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.8-flash-thinking',
        displayName: 'o1 Reasoning (Deep Think)',
        description: 'Uses step-by-step reasoning for complex math, coding, and logical puzzles.',
        badge: 'Reasoning',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.8-flash-creative',
        displayName: 'Creative & Prose Mode',
        description: 'Optimized for storytelling, engaging dialogue, and creative writing.',
        badge: 'Creative',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.8-flash-coder',
        displayName: 'Code Architect Mode',
        description: 'Specialized for writing clean code, refactoring, and debugging.',
        badge: 'Coding',
        contextLimit: '128k',
        supportsVision: true,
      },
    ],
  });
});

// Proxy endpoint to browse any website without navigating away or being blocked by iframe security headers
app.get('/api/proxy/browse', async (req, res) => {
  let targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('URL query parameter is required');
    return;
  }

  // Normalize URL
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

    // If non-HTML (e.g. image, pdf, script), pipe raw data directly
    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove frame-busting or blocking headers meta tags
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();

    // Ensure base tag points to the target website so images and stylesheets load
    $('base').remove();
    $('head').prepend(`<base href="${finalUrl}" target="_self">`);

    // Injected script inside iframe to intercept clicks and keep navigation inside proxy
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

    // Rewrite anchor tags
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

// Extract clean text and metadata from website for reader mode and AI questions
app.get('/api/proxy/extract', async (req, res) => {
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

    // Remove unwanted script/style elements for clean text
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

// SSE Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  if (!apiKey) {
    res.status(500).json({
      error:
        'GEMINI_API_KEY is missing. Please add GEMINI_API_KEY to your .env file (or your hosting platform\'s Environment Variables). You can get a free API key at https://aistudio.google.com/app/apikey',
    });
    return;
  }

  const {
    messages,
    modelId = 'gemini-3.8-flash',
    systemInstruction = '',
    customInstructions = '',
    webSearch = false,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Handle client abort
  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
  });

  try {
    // Build combined system prompt
    let combinedSystem = `You are ChatGPT, a large language model trained by OpenAI (embodied here with state-of-the-art AI intelligence).
You provide helpful, insightful, accurate, and markdown-formatted answers.
Format code with markdown triple-backticks with syntax identifiers.
When asked mathematical problems or reasoning, provide structured, clear explanations.
Tone should be polite, authentic, knowledgeable, and responsive.`;

    if (modelId === 'gemini-3.8-flash-coder') {
      combinedSystem += `\nYou are operating in Code Architect Mode. Focus on high quality, production-ready, clean, well-documented code with unit tests, best practices, and concise technical explanations.`;
    } else if (modelId === 'gemini-3.8-flash-creative') {
      combinedSystem += `\nYou are operating in Creative & Prose Mode. Emphasize vivid descriptions, nuanced tone, captivating narrative voice, and thoughtful style.`;
    }

    if (systemInstruction) {
      combinedSystem += `\n\nSpecific task guidance: ${systemInstruction}`;
    }
    if (customInstructions) {
      combinedSystem += `\n\nUser Custom Instructions: ${customInstructions}`;
    }

    // Map messages to Gemini format: role 'user' | 'model'
    // and parts containing text and optional inlineData
    const contents = messages.map((msg: any) => {
      const parts: any[] = [];

      // Check if image attachment exists
      if (msg.image && msg.image.data && msg.image.mimeType) {
        // Strip data:image/...;base64, prefix if included
        let rawBase64 = msg.image.data;
        if (rawBase64.includes('base64,')) {
          rawBase64 = rawBase64.split('base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: rawBase64,
          },
        });
      }

      if (msg.content) {
        parts.push({
          text: msg.content,
        });
      }

      return {
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: parts.length > 0 ? parts : [{ text: '' }],
      };
    });

    // Configure tools if web search requested
    const tools: any[] = [];
    if (webSearch) {
      tools.push({ googleSearch: {} });
    }

    // Config setup
    const config: any = {
      systemInstruction: combinedSystem,
    };

    if (tools.length > 0) {
      config.tools = tools;
    }

    // Use Gemini 3.8 Flash model
    const actualModel = 'gemini-3.8-flash';

    const responseStream = await ai.models.generateContentStream({
      model: actualModel,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      if (isAborted) break;

      const chunkText = chunk.text || '';
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
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

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ChatGPT Server running at http://localhost:${PORT}`);
  });
}

if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
