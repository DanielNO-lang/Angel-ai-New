/**
 * ANGEL AI — Vercel Serverless Function Adapter
 * Load the bundled server build so Node ESM does not fail on extensionless
 * TypeScript imports inside the server tree.
 */
import serverModule from '../dist/server.cjs';

const { createApp } = serverModule as { createApp: (options?: { isServerless?: boolean }) => Promise<any> };

let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) {
    appPromise = createApp({ isServerless: true });
  }
  const app = await appPromise;
  return app(req, res);
}
