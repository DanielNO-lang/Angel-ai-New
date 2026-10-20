/** Keep provider failures useful to the user without leaking credentials or internals. */
export function safeChatErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'An unexpected provider failure occurred.';
  const safe = raw
    .replace(/(api[_ -]?key|authorization|bearer|token|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return safe || 'The request failed without a usable error message.';
}
