import { searchGroundedWeb, GroundedSearchResult, GroundedWebSource } from './groundedSearchService.js';

export interface ResearchStep {
  query: string;
  success: boolean;
  answer?: string;
  sources: GroundedWebSource[];
  timestamp: string;
  error?: string;
}

export interface ResearchReport {
  title: string;
  query: string;
  status: 'completed' | 'partial' | 'failed';
  steps: ResearchStep[];
  sources: GroundedWebSource[];
  createdAt: string;
}

export type GroundedSearch = (query: string, requestedResults?: number) => Promise<GroundedSearchResult>;

export function buildResearchQueries(query: string, followUpQueries: string[] = []): string[] {
  const clean = query.trim().replace(/\s+/g, ' ').slice(0, 500);
  if (!clean) throw new Error('A research question is required.');
  const supplied = followUpQueries
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().replace(/\s+/g, ' ').slice(0, 300))
    .filter(Boolean);
  const candidates = supplied.length
    ? [clean, ...supplied]
    : [
        clean,
        `${clean} official sources documentation`.slice(0, 500),
        `${clean} evidence limitations independent analysis`.slice(0, 500),
        `${clean} recent developments`.slice(0, 500),
      ];
  return Array.from(new Set(candidates.map((item) => item.trim()))).slice(0, 4);
}

export function mergeResearchSources(steps: ResearchStep[]): GroundedWebSource[] {
  const byUrl = new Map<string, GroundedWebSource>();
  for (const step of steps) {
    for (const source of step.sources) {
      try {
        const parsed = new URL(source.url);
        if (!['https:', 'http:'].includes(parsed.protocol)) continue;
        if (!byUrl.has(parsed.href)) byUrl.set(parsed.href, { ...source, url: parsed.href });
      } catch {
        // Invalid provider metadata is never turned into a clickable source.
      }
    }
  }
  return Array.from(byUrl.values());
}

export function deriveResearchStatus(steps: ResearchStep[]): ResearchReport['status'] {
  const successes = steps.filter((step) => step.success && Boolean(step.answer?.trim()) && step.sources.length > 0).length;
  if (successes === steps.length && successes > 0) return 'completed';
  if (successes > 0) return 'partial';
  return 'failed';
}

/** Multi-query research using only real search-grounding metadata for citations. */
export async function runGroundedResearch(
  query: string,
  followUpQueries: string[] = [],
  search: GroundedSearch = searchGroundedWeb,
): Promise<ResearchReport> {
  const queries = buildResearchQueries(query, followUpQueries);
  const steps: ResearchStep[] = [];
  for (const item of queries) {
    try {
      const result = await search(item, 5);
      steps.push({
        query: item,
        success: result.success,
        answer: result.answer,
        sources: result.sources || [],
        timestamp: result.timestamp || new Date().toISOString(),
        error: result.success ? undefined : (result.error || 'Grounded search did not return a verifiable answer and sources.'),
      });
    } catch (error) {
      steps.push({
        query: item,
        success: false,
        sources: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Grounded search failed.',
      });
    }
  }
  const createdAt = new Date().toISOString();
  return {
    title: query.trim().replace(/\s+/g, ' ').slice(0, 160),
    query: query.trim().replace(/\s+/g, ' ').slice(0, 500),
    status: deriveResearchStatus(steps),
    steps,
    sources: mergeResearchSources(steps),
    createdAt,
  };
}
