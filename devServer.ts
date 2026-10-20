import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { createApp } from './server';

/**
 * Standalone development/server entrypoint.
 * Kept separate from server.ts so Netlify's function bundler never traverses Vite's
 * optional development-only dependency graph.
 */
async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = await createApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Angel AI] Server listening on http://0.0.0.0:${PORT} (Node ${process.version})`);
  });
}

startServer().catch((error) => {
  console.error('[Angel AI Server Fatal Startup Error]', error);
  process.exitCode = 1;
});
