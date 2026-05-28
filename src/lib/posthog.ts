import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://posthog.growlead.cz';

/**
 * PostHog client instance.
 *
 * If POSTHOG_KEY is empty (default in template), events are no-ops — safe to
 * call `posthog.capture(...)` from anywhere without crashing.
 *
 * Configure in .env.local:
 *   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxx
 *   EXPO_PUBLIC_POSTHOG_HOST=https://posthog.growlead.cz
 */
export const posthog = new PostHog(POSTHOG_KEY, {
  host: POSTHOG_HOST,
  // Disable autocapture by default — opt-in per app once events are designed.
  captureAppLifecycleEvents: false,
});
