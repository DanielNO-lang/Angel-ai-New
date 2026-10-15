import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { searchGroundedWeb } from './groundedSearchService.js';

const previousKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousKey;
});

test('grounded search rejects an empty query before contacting a provider', async () => {
  await assert.rejects(searchGroundedWeb('   '), /search query is required/i);
});

test('grounded search fails explicitly when Gemini is not configured', async () => {
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(searchGroundedWeb('latest technology news'), /GEMINI_API_KEY is not configured/i);
});
