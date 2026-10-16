import serverless from "serverless-http";
import { createApp } from "../../dist/server.js";

// Reuse the initialized Express app across warm invocations.
const appHandlerPromise = createApp({ isServerless: true }).then((app) => serverless(app));

export const handler = async (event: any, context: any) => {
  const appHandler = await appHandlerPromise;
  return appHandler(event, context);
};
