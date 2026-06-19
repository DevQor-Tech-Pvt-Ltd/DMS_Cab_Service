import * as Sentry from "@sentry/react";

/**
 * Initializes Sentry in the frontend environment (Phase 9)
 * Gracefully defaults if VITE_SENTRY_DSN is not configured.
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", /^\//],
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    console.log("[Sentry] Frontend instrumentation successfully initialized.");
  } else {
    console.log("[Sentry] VITE_SENTRY_DSN not set. Running without Sentry client monitoring.");
  }
};
