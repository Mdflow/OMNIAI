import { handleAIRequest } from '../../lib/ai.ts';

// Modern functions receive Netlify AI Gateway credentials and stream natively.
export default async (request: Request) => handleAIRequest(request);
