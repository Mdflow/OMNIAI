import { handleAIRequest } from './lib/ai.ts';
import express, { Router } from 'express';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const router = Router();
router.use(express.json({ limit: '25mb' }));

// Share AI behavior between the local Express server and the modern Netlify function.
async function forwardAI(req: express.Request, res: express.Response) {
  const response = await handleAIRequest(new Request(`http://localhost${req.path}`, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    ...(req.method === 'POST' ? { body: JSON.stringify(req.body) } : {}),
  }));
  res.status(response.status);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  if (response.body) {
    for await (const chunk of response.body) {
      if (res.destroyed) break;
      res.write(Buffer.from(chunk));
    }
  }
  res.end();
}

router.get(['/health', '/api/health', '/.netlify/functions/api/health'], forwardAI);
router.post(['/key-status', '/api/key-status', '/.netlify/functions/api/key-status'], forwardAI);

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
        displayName: 'Gemini Flash',
        description: 'Ultra-fast, responsive intelligence for text, coding, and vision analysis.',
        badge: 'Recommended ⚡',
        contextLimit: '128k',
        supportsVision: true,
      },
      {
        id: 'gemini-3.5-flash',
        displayName: 'Deep Think Mode',
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

router.post(['/chat/stream', '/api/chat/stream', '/.netlify/functions/api/chat/stream'], forwardAI);

export default router;
