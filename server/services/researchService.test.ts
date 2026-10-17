import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildResearchQueries, mergeResearchSources, deriveResearchStatus, runGroundedResearch } from './researchService.js';
import type { GroundedSearchResult } from './groundedSearchService.js';

const result = (query: string, url: string): GroundedSearchResult => ({
  success: true,
  query,
  answer: `Grounded answer for ${query}`,
  sources: [{ title: 'Example source', url }],
  timestamp: '2026-10-17T00:00:00.000Z',
});

test('research plan contains the original question, caps steps, and deduplicates user queries', () => {
  assert.deepEqual(
    buildResearchQueries('Angel AI', ['Follow-up one', 'Angel AI', 'Follow-up one', 'Follow-up two', 'Follow-up three']),
    ['Angel AI', 'Follow-up one', 'Follow-up two']
  );
  assert.throws(() => buildResearchQueries('   '), /question is required/i);
});

test('source merging deduplicates URLs and rejects invalid schemes', () => {
  const sources = mergeResearchSources([
    { query: 'a', success: true, sources: [{ title: 'First', url: 'https://example.com/a' }], timestamp: 'now' },
    { query: 'b', success: true, sources: [{ title: 'Duplicate', url: 'https://example.com/a' }, { title: 'Bad', url: 'javascript:alert(1)' }], timestamp: 'now' },
  ]);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].title, 'First');
});

test('research status distinguishes complete, partial, and failed reports', () => {
  const good = { query: 'q', success: true, answer: 'A', sources: [{ title: 's', url: 'https://example.com' }], timestamp: 'now' };
  const bad = { query: 'q2', success: false, sources: [], timestamp: 'now', error: 'missing grounding' };
  assert.equal(deriveResearchStatus([good]), 'completed');
  assert.equal(deriveResearchStatus([good, bad]), 'partial');
  assert.equal(deriveResearchStatus([bad]), 'failed');
});

test('research executes bounded multi-step queries and keeps only grounded sources', async () => {
  const seen: string[] = [];
  const report = await runGroundedResearch('Angel AI', ['Angel product behavior', 'Angel AI security'], async (query) => {
    seen.push(query);
    return result(query, 'https://example.com/research');
  });
  assert.equal(seen.length, 3);
  assert.equal(report.status, 'completed');
  assert.equal(report.steps.length, 3);
  assert.equal(report.sources.length, 1);
  assert.equal(report.sources[0].url, 'https://example.com/research');
});
