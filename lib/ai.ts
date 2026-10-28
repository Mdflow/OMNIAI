import { GoogleGenAI, type Content } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';
const SOURCE = 'Netlify AI Gateway · Gemini Flash';

// Only safe, application-owned messages reach the browser; provider errors can contain secrets.
const unavailable = 'The AI service is temporarily unavailable. Please try again.';

export async function handleAIRequest(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === 'GET' && path.endsWith('/health')) {
    return Response.json({ status: 'ok', source: SOURCE });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  if (path.endsWith('/key-status')) {
    try {
      const ai = new GoogleGenAI({});
      await ai.models.generateContent({
        model: MODEL,
        contents: 'Reply OK.',
        config: { maxOutputTokens: 16 },
      });
      return Response.json({ configured: true, valid: true, source: SOURCE });
    } catch {
      return Response.json({ valid: false, source: SOURCE, error: unavailable });
    }
  }
  if (!path.endsWith('/chat/stream')) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON request' }, { status: 400 });
  }
  if (!Array.isArray(body?.messages) || !body.messages.length) {
    return Response.json({ error: 'Messages array is required' }, { status: 400 });
  }
  const contents: Content[] = [];
  for (const message of body.messages) {
    if (!message || typeof message !== 'object') continue;
    const parts: NonNullable<Content['parts']> = [];
    if (typeof message.content === 'string' && message.content.trim()) {
      parts.push({ text: message.content });
    }
    if (typeof message.image?.data === 'string' && typeof message.image?.mimeType === 'string') {
      parts.push({ inlineData: {
        mimeType: message.image.mimeType,
        data: message.image.data.replace(/^data:[^,]+,/, ''),
      } });
    }
    if (parts.length) contents.push({
      role: ['assistant', 'model'].includes(message.role) ? 'model' : 'user', parts,
    });
  }
  while (contents.at(-1)?.role === 'model') contents.pop();
  if (!contents.length) {
    return Response.json({ error: 'A user message is required' }, { status: 400 });
  }

  let systemInstruction = 'You are OmniChat, a helpful AI assistant powered by Google Gemini. Provide accurate, clear answers in Markdown. Format code in fenced code blocks with language names.';
  if (String(body.modelId).endsWith('-coder')) {
    systemInstruction += ' Focus on software architecture, clean code, debugging, and practical explanations.';
  } else if (String(body.modelId).endsWith('-creative')) {
    systemInstruction += ' Focus on creative writing, vivid descriptions, and engaging prose.';
  } else if (body.modelId === 'gemini-3.5-flash' || String(body.modelId).endsWith('-thinking')) {
    systemInstruction += ' Carefully solve complex problems and explain the key steps clearly.';
  }
  for (const instruction of [body.systemInstruction, body.customInstructions]) {
    if (typeof instruction === 'string') systemInstruction += `\n${instruction}`;
  }
  try {
    const ai = new GoogleGenAI({});
    const upstream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        ...(body.webSearch ? { tools: [{ googleSearch: {} }] } : {}),
        abortSignal: request.signal,
      },
    });
    const encoder = new TextEncoder();
    const iterator = upstream[Symbol.asyncIterator]();
    const event = (data: unknown) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    return new Response(new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await iterator.next();
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } else if (value.text) {
            controller.enqueue(event({ text: value.text }));
          }
        } catch {
          controller.enqueue(event({ error: unavailable }));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
      async cancel() { await iterator.return?.(undefined); },
    }), { headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    } });
  } catch {
    return Response.json({ error: unavailable }, { status: 503 });
  }
}
