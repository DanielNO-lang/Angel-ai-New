import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANGEL_EXPRESSIONS,
  ANGEL_PERSONAS,
  isStandaloneEndConversationIntent,
} from '../src/data/angelPersona';

describe('Angel persona catalog', () => {
  it('defines the same 12 semantic expression keys for either presentation', () => {
    assert.equal(ANGEL_EXPRESSIONS.length, 12);
    assert.equal(new Set(ANGEL_EXPRESSIONS.map((item) => item.key)).size, 12);
    assert.ok(ANGEL_PERSONAS.female.expressionAssetPath('happy').includes('/female/'));
    assert.ok(ANGEL_PERSONAS.male.expressionAssetPath('happy').includes('/male/'));
  });

  it('recognizes only a standalone end-conversation command', () => {
    assert.equal(isStandaloneEndConversationIntent('End conversation'), true);
    assert.equal(isStandaloneEndConversationIntent('Please end conversation!'), true);
    assert.equal(isStandaloneEndConversationIntent('I want to end conversation'), false);
    assert.equal(isStandaloneEndConversationIntent('do not end conversation'), false);
    assert.equal(isStandaloneEndConversationIntent('end conversation after this'), false);
  });
});
