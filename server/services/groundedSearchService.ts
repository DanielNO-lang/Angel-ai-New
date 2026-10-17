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

async function searchWithBrave(query: string, resultLimit: number, apiKey: string): Promise<GroundedSearchResult> {
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('count', String(Math.min(20, Math.max(1, resultLimit))));
  endpoint.searchParams.set('search_lang', 'en');

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    // Never include request headers or provider credentials in the error.
    throw new Error(`Brave Search request failed (HTTP ${response.status}).`);
  }

  const payload = await response.json() as {
    web?: { results?: Array<{ title?: unknown; url?: unknown; description?: unknown }> };
  };
  const rows = Array.isArray(payload.web?.results) ? payload.web!.results! : [];
  const sources: GroundedWebSource[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row.url !== 'string' || typeof row.title !== 'string') continue;
    try {
      const url = new URL(row.url);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      sources.push({
        title: row.title.trim().slice(0, 300) || url.hostname,
        url: url.href,
        snippet: typeof row.description === 'string' ? row.description.slice(0, 2000) : undefined,
      });
    } catch {
      // Provider result URLs are untrusted input. Ignore malformed links.
    }
    if (sources.length >= resultLimit) break;
  }

  if (!sources.length) {
    return {
      success: false,
      query,
      sources: [],
      timestamp: new Date().toISOString(),
      error: 'Brave Search returned no usable source links.',
    };
  }
  return {
    success: true,
    query,
    // This fallback provides attributed source snippets, not a model-written synthesis.
    answer: 'Direct web-search fallback (source snippets, not an AI-generated synthesis):\n\n' +
      sources.map((source, index) => `${index + 1}. ${source.title}\n${source.snippet || source.url}`).join('\n\n'),
    sources,
    timestamp: new Date().toISOString(),
  };
}

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
  const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!process.env.GEMINI_API_KEY?.trim()) {
    if (braveKey) return searchWithBrave(cleanQuery, resultLimit, braveKey);
    throw new Error('Neither GEMINI_API_KEY nor BRAVE_SEARCH_API_KEY is configured.');
  }

  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
  } catch (error) {
    if (braveKey) return searchWithBrave(cleanQuery, resultLimit, braveKey);
    throw error;
  }

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
    if (braveKey) return searchWithBrave(cleanQuery, resultLimit, braveKey);
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
