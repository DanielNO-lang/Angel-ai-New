import { GoogleGenAI } from '@google/genai';

export interface GroundedWebSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GroundedSearchResult {
  success: boolean;
  query: string;
  answer?: string;
  sources: GroundedWebSource[];
  timestamp: string;
  error?: string;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Real Google Search grounding. Source URLs are taken only from provider grounding
 * metadata; this service never constructs fake search result links.
 */
export async function searchGroundedWeb(query: string, requestedResults = 5): Promise<GroundedSearchResult> {
  const cleanQuery = query.trim().slice(0, 500);
  if (!cleanQuery) throw new Error('A search query is required.');

  const resultLimit = Math.max(1, Math.min(5, Math.floor(requestedResults || 5)));
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: [
      'Research the query using Google Search grounding. Answer with current, factual information. Distinguish confirmed facts from developing or unverified claims. Do not invent sources or dates. Keep the answer concise and useful.',
      '',
      'User query:',
      cleanQuery,
    ].join('\n'),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    },
  });

  const metadata = (response.candidates?.[0] as any)?.groundingMetadata;
  const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : [];
  const seen = new Set<string>();
  const sources: GroundedWebSource[] = [];

  for (const chunk of chunks) {
    const uri = typeof chunk?.web?.uri === 'string' ? chunk.web.uri : '';
    if (!uri || seen.has(uri)) continue;
    try {
      const parsed = new URL(uri);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
      seen.add(uri);
      sources.push({
        title: typeof chunk.web.title === 'string' && chunk.web.title.trim()
          ? chunk.web.title.trim()
          : parsed.hostname,
        url: uri,
        snippet: typeof chunk.web.snippet === 'string' ? chunk.web.snippet : undefined,
      });
    } catch {
      // Ignore malformed URLs returned in untrusted provider metadata.
    }
    if (sources.length >= resultLimit) break;
  }

  const answer = typeof response.text === 'string' ? response.text.trim() : '';
  if (!answer || sources.length === 0) {
    return {
      success: false,
      query: cleanQuery,
      answer: answer || undefined,
      sources,
      timestamp: new Date().toISOString(),
      error: 'Google Search grounding did not return both an answer and source metadata. No synthetic results were created.',
    };
  }

  return {
    success: true,
    query: cleanQuery,
    answer,
    sources,
    timestamp: new Date().toISOString(),
  };
}
