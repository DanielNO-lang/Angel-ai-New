import serverless from "serverless-http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type NetlifyApiEvent = {
  path?: string;
  rawUrl?: string;
  [key: string]: any;
};

/**
 * Normalize Netlify's function-relative paths to the /api/* routes registered
 * by Express. This is safe for both direct function URLs and configured rewrites.
 */
export function normalizeNetlifyApiEvent<T extends NetlifyApiEvent>(event: T): T & { path: string } {
  let rawPath = typeof event.path === "string" ? event.path : "";

  if (!rawPath && typeof event.rawUrl === "string") {
    try {
      rawPath = new URL(event.rawUrl).pathname;
    } catch {
      rawPath = "/";
    }
  }

  const functionPrefix = "/.netlify/functions/api";
  if (rawPath.startsWith(functionPrefix)) {
    rawPath = rawPath.slice(functionPrefix.length);
  }

  if (rawPath === "/api" || rawPath.startsWith("/api/")) {
    return { ...event, path: rawPath };
  }

  const suffix = rawPath && rawPath !== "/" ? rawPath : "";
  return { ...event, path: `/api${suffix.startsWith("/") ? suffix : suffix ? `/${suffix}` : ""}` };
}

let appHandlerPromise: Promise<any> | undefined;

function resolveServerEntryPath(): string {
  const functionDirectory = path.dirname(fileURLToPath(import.meta.url));
  const taskRoot = process.env.LAMBDA_TASK_ROOT || process.cwd();
  const candidates = [
    path.resolve(taskRoot, "server-build/server.mjs"),
    path.resolve(process.cwd(), "server-build/server.mjs"),
    path.resolve(functionDirectory, "server-build/server.mjs"),
    path.resolve(functionDirectory, "../../server-build/server.mjs"),
    path.resolve(functionDirectory, "../server-build/server.mjs"),
  ];
  const bundledServerPath = [...new Set(candidates)].find(existsSync);
  if (bundledServerPath) return bundledServerPath;

  // A deployed Lambda must never try to load the uncompiled TypeScript entrypoint.
  // Source-mode tests can still use tsx when they run without a production bundle.
  if (process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error("Packaged Angel server bundle server-build/server.mjs was not found.");
  }
  return path.resolve(process.cwd(), "server.ts");
}

async function getAppHandler() {
  // Avoid starting the standalone development listener inside Netlify Functions.
  process.env.NETLIFY = "true";

  if (!appHandlerPromise) {
    const serverEntryPath = resolveServerEntryPath();
    appHandlerPromise = import(pathToFileURL(serverEntryPath).href)
      .then(({ createApp }) => createApp({ isServerless: true }))
      .then((app) => serverless(app));
  }

  try {
    return await appHandlerPromise;
  } catch (error) {
    // Allow a later warm invocation to retry after a transient initialization failure.
    appHandlerPromise = undefined;
    throw error;
  }
}

export const handler = async (event: NetlifyApiEvent, context: any) => {
  try {
    const appHandler = await getAppHandler();
    return await appHandler(normalizeNetlifyApiEvent(event), context);
  } catch (error) {
    console.error("[Angel Netlify API] Initialization or dispatch failed.", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
      body: JSON.stringify({
        error: "Angel API initialization failed.",
        code: "api_init_failed",
      }),
    };
  }
};
