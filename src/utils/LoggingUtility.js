import { GCPLogger } from "npm-gcp-logging";
import { v4 as uuidv4 } from "uuid";
import { GCPAccessToken } from "npm-gcp-token";

export default {
  async buildLogContext(env) {
    var context = {
      ENVIRONMENT: env.ENVIRONMENT,
      GCP_LOGGING_PROJECT_ID: env.GCP_LOGGING_PROJECT_ID,
      LOGGING_TOKEN: await new GCPAccessToken(env.GCP_LOGGING_CREDENTIALS).getAccessToken("https://www.googleapis.com/auth/logging.write"),
      LOG_NAME: env.LOG_NAME,
      SpanId: uuidv4(),
      VERSION: env.VERSION,
    }
    return context;
  },
  async logEntry(context, entries) {
    var finalEntries = [];
    for (var entry of entries) {
      entry.spanId = context.SpanId;
      entry.labels = {
        environment: context.ENVIRONMENT,
        spanId: context.SpanId,
        version: context.VERSION,
      }
      finalEntries.push(entry);
    }
    await GCPLogger.logEntry(
      context.GCP_LOGGING_PROJECT_ID,
      context.LOGGING_TOKEN,
      context.LOG_NAME,
      finalEntries
    );
  }
}
