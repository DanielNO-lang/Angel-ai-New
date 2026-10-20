import serverless from "serverless-http";

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

async function getAppHandler() {
  // Set this before evaluating server.ts so its standalone listener never starts
  // inside a Netlify Function invocation.
  process.env.NETLIFY = "true";

  if (!appHandlerPromise) {
    // The production build emits this bundled server entry before Netlify bundles functions.
    // @ts-expect-error Generated at build time by the `build` script.
    appHandlerPromise = import("../../server-build/server.js")
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
