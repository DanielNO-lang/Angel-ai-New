import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { searchGroundedWeb } from './groundedSearchService.js';

const previousKey = process.env.GEMINI_API_KEY;
const previousBraveKey = process.env.BRAVE_SEARCH_API_KEY;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousKey;
  if (previousBraveKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
  else process.env.BRAVE_SEARCH_API_KEY = previousBraveKey;
  globalThis.fetch = originalFetch;
});

test('grounded search rejects an empty query before contacting a provider', async () => {
  await assert.rejects(searchGroundedWeb('   '), /search query is required/i);
});

test('grounded search fails explicitly when Gemini is not configured', async () => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  await assert.rejects(searchGroundedWeb('latest technology news'), /neither GEMINI_API_KEY nor BRAVE_SEARCH_API_KEY is configured/i);
});


test('grounded search uses attributed Brave results when Gemini is not configured', async () => {
  delete process.env.GEMINI_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = 'test-key';
  globalThis.fetch = (async () => new Response(JSON.stringify({
    web: {
      results: [
        { title: 'Official source', url: 'https://example.gov/research', description: 'An attributed official summary.' },
        { title: 'Unsafe URL', url: 'javascript:alert(1)', description: 'Must be ignored.' },
      ],
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

  const result = await searchGroundedWeb('a current research query', 5);
  assert.equal(result.success, true);
  assert.match(result.answer || '', /not an AI-generated synthesis/i);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].url, 'https://example.gov/research');
});
