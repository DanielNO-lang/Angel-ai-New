/**
 * ANGEL AI — Vercel Serverless Function Adapter
 * Framework-standard entry point for Vercel deployments.
 * Mounts the portable Express application router without maintaining long-running sockets.
 */

import { createApp } from '../server';

let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) {
    appPromise = createApp({ isServerless: true });
  }
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('[Angel API bootstrap failure]', error);
    appPromise = null;
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Angel API could not initialize. Check the deployed server function logs and environment configuration.',
      });
    } else {
      res.end();
    }
  }
}
