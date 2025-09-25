// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

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
      // Filter out development and common errors
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Filter out common user errors that don't need tracking
      const isUserError = event.exception?.values?.some(
        exception =>
          exception.value?.includes('ValidationError') ||
          exception.value?.includes('User not found') ||
          exception.value?.includes('Invalid credentials')
      )

      if (isUserError) {
        return null
      }

      return event
    },
  })
}
