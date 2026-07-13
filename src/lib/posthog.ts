import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://posthog.growlead.cz';

/**
 * PostHog client — env-gated (same pattern as Sentry, ADR-009).
 *
 * `null` when EXPO_PUBLIC_POSTHOG_KEY is empty: constructing PostHog with an
 * empty key throws a red LogBox error in dev ("You must pass your PostHog
 * project's api key") — verified R8 smoke test 2026-07-13 (PROD-2697).
 * The root layout skips the provider entirely when null.
 *
 * Configure in .env.local:
 *   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxx
 *   EXPO_PUBLIC_POSTHOG_HOST=https://posthog.growlead.cz
 */
export const posthog = POSTHOG_KEY
  ? new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Disable autocapture by default — opt-in per app once events are designed.
      captureAppLifecycleEvents: false,
    })
  : null;
