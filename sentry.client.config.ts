// This file configures the initialization of Sentry on the browser/client.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // ...
    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Filter out development errors
      if (process.env.NODE_ENV === 'development') {
        // Only send errors in development if they're not common dev errors
        const isDevError = event.exception?.values?.some(exception =>
          exception.value?.includes('ChunkLoadError') ||
          exception.value?.includes('Loading chunk') ||
          exception.value?.includes('Loading CSS chunk')
        );

        if (isDevError) {
          return null;
        }
      }

      return event;
    },
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}