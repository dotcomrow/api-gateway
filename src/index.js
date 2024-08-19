import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
import { default as LogUtility } from "./utils/LoggingUtility.js";

export default {
  async fetch(request, env, context) {
    self.location = new URL("https://www.google.com");
    var loggingContext = await LogUtility.buildLogContext(env);
    try {
      return await handleRequest(request, env, context, loggingContext);
    } catch (e) {
      const responseError = serializeError(e);
      await LogUtility.logEntry(loggingContext, [
        {
          severity: "ERROR",
          jsonPayload: {
            message: "Exception occurred in fetch",
            error: serializeError(err),
          },
        },
      ]);
      return new Response(JSON.stringify(responseError), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};
