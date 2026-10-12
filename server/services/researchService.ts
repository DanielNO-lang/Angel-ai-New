import { GoogleGenAI } from '@google/genai';

export interface WebResearchSource {
  title: string;
  url: string;
}

export interface WebResearchResult {
  query: string;
  answer: string;
  sources: WebResearchSource[];
  searchQueries: string[];
  modelId: string;
  grounded: boolean;
}

export class ResearchService {
  private client(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey?.trim()) throw new Error('Web research is unavailable: GEMINI_API_KEY is not configured.');
    return new GoogleGenAI({ apiKey });
  }

  async search(query: string, options: { modelId?: string; maxSources?: number } = {}): Promise<WebResearchResult> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3 || normalizedQuery.length > 2000) {
      throw new Error('Search query must contain 3 to 2,000 characters.');
    }

    const modelId = options.modelId || 'gemini-3.8-flash';
    const response = await this.client().models.generateContent({
      model: modelId,
      contents: normalizedQuery,
      config: {
        systemInstruction: [
          'You are Angel AI Research.',
          'Use Google Search grounding to answer the request with current, verifiable information.',
          'Distinguish confirmed facts from uncertainty. Do not invent sources or URLs.',
          'Summarize the most relevant findings clearly and include dates where they matter.',
        ].join(' '),
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = (response as any).candidates?.[0];
    const grounding = candidate?.groundingMetadata;
    const chunks = Array.isArray(grounding?.groundingChunks) ? grounding.groundingChunks : [];
    const maxSources = Math.min(10, Math.max(1, Number(options.maxSources) || 6));
    const seen = new Set<string>();
    const sources: WebResearchSource[] = [];

    for (const chunk of chunks) {
      const web = chunk?.web;
      const url = typeof web?.uri === 'string' ? web.uri : '';
      if (!url || !/^https:\/\//i.test(url) || seen.has(url)) continue;
      seen.add(url);
      sources.push({
        title: typeof web.title === 'string' && web.title.trim() ? web.title.trim().slice(0, 240) : new URL(url).hostname,
        url,
      });
      if (sources.length >= maxSources) break;
    }

    const searchQueries = Array.isArray(grounding?.webSearchQueries)
      ? grounding.webSearchQueries.filter((value: unknown) => typeof value === 'string').slice(0, 8)
      : [];

    return {
      query: normalizedQuery,
      answer: response.text?.trim() || '',
      sources,
      searchQueries,
      modelId,
      grounded: sources.length > 0,
    };
  }
}

export const researchService = new ResearchService();
