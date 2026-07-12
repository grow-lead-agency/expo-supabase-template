import * as Sentry from '@sentry/react-native';

/**
 * Sentry — wired by default, env-gated no-op (ADR-009, same pattern as PostHog).
 * With empty EXPO_PUBLIC_SENTRY_DSN nothing initializes and capture calls are
 * safe no-ops. Configure in .env.local + EAS secrets to activate.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = Boolean(DSN);

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}

export { Sentry };
