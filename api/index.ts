/**
 * ANGEL AI — Vercel Serverless Function Adapter.
 * The backend bundle is emitted as native ESM so Node can load ESM-only
 * dependencies (including Vite) without require() compatibility failures.
 */
import { createApp } from '../dist/server.js';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) {
    appPromise = createApp({ isServerless: true });
  }
  const app = await appPromise;
  return app(req, res);
}
