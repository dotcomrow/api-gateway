import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
import { GCPLogger } from "npm-gcp-logging";
import { GCPAccessToken } from "npm-gcp-token";

export default {
  async fetch(request, env, context) {
    self.location = new URL("https://www.google.com");
    try {
      return await handleRequest(request, env, context);
    } catch (e) {
      var logging_token = await new GCPAccessToken(
        env.GCP_LOGGING_CREDENTIALS
      ).getAccessToken("https://www.googleapis.com/auth/logging.write");
      const responseError = serializeError(e);
      await GCPLogger.logEntry(
        env.GCP_LOGGING_PROJECT_ID,
        logging_token.access_token,
        env.LOG_NAME,
        [
          {
            severity: "ERROR",
            // textPayload: message,
            jsonPayload: {
              responseError,
            },
          },
        ]
      );
      return new Response(JSON.stringify(responseError), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};
