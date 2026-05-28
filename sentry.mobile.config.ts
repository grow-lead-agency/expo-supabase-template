/**
 * Sentry mobile configuration (Expo plugin reads this at build time).
 *
 * Setup:
 *   1. Configure DSN in .env.local:
 *        EXPO_PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/123456
 *   2. Add `@sentry/react-native/expo` to expo.plugins in app.json.
 *   3. Wrap root layout with Sentry.wrap (see app/_layout.tsx — opt-in).
 *
 * For now this is a placeholder. Activate per-project once Sentry org/project
 * is provisioned.
 */
import * as Sentry from '@sentry/react-native';

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // Silent no-op in development / unconfigured forks.
    return;
  }
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}
