import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANGEL_CORE_PERSONA_PROMPT,
  ANGEL_DEFAULT_TTS_STYLE_PROMPT,
} from '../src/services/ai/angelPersona';

test('Angel core persona preserves the assigned specialist role and honest capabilities', () => {
  assert.match(ANGEL_CORE_PERSONA_PROMPT, /preserve that assigned role/i);
  assert.match(ANGEL_CORE_PERSONA_PROMPT, /Be transparent about your identity, capabilities and limitations/i);
  assert.match(ANGEL_CORE_PERSONA_PROMPT, /Never claim an external action succeeded unless the application confirms it/i);
  assert.match(ANGEL_CORE_PERSONA_PROMPT, /wake-word detection, speaker recognition, noise reduction, transcription and live turn-taking are separate technical features/i);
  assert.doesNotMatch(ANGEL_CORE_PERSONA_PROMPT, /possess real human experiences/i);
});

test('Angel default TTS direction includes restrained natural delivery', () => {
  assert.match(ANGEL_DEFAULT_TTS_STYLE_PROMPT, /natural conversational rhythm/i);
  assert.match(ANGEL_DEFAULT_TTS_STYLE_PROMPT, /Avoid monotony/i);
});
