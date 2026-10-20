import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const candidates = [process.env.COMMIT_REF, process.env.NETLIFY_COMMIT_REF, process.env.GITHUB_SHA];
const commitSha = candidates.find((candidate) => typeof candidate === 'string' && /^[0-9a-f]{7,40}$/i.test(candidate)) || 'unknown';
const target = fileURLToPath(new URL('../server/buildMeta.ts', import.meta.url));
const content = `// Generated at build time. Do not edit by hand for a specific deploy.\nexport const BUILD_COMMIT_SHA = ${JSON.stringify(commitSha)};\n`;
await writeFile(target, content, 'utf8');
console.log(`[Angel build] commit marker: ${commitSha}`);
