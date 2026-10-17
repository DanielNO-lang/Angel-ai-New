import serverless from "serverless-http";
import { createApp } from "../../server.ts";
import type { Express } from "express";

// Reuse the initialized Express app across warm invocations.
const appHandlerPromise = createApp({ isServerless: true }).then((app: Express) => serverless(app));

export const handler = async (event: any, context: any) => {
  const appHandler = await appHandlerPromise;
  return appHandler(event, context);
};
