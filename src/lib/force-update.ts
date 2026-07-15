/**
 * Force-update gate — pure logic module (PROD-5165 / ADR-010).
 *
 * IMPORTANT: this file MUST NOT import react-native, expo-application, or
 * `./supabase`. It needs to run under plain `bun test` (see
 * force-update.test.ts) without pulling in native modules that only exist
 * inside the RN runtime. All I/O is injected via `checkForceUpdate`'s `deps`
 * parameter — see src/components/force-update-gate.tsx for the real wiring.
 *
 * Fail-open philosophy: any ambiguity (missing config row, network error,
 * unparseable version string, missing table) resolves to 'ok'. This gate
 * exists to protect users from breaking API changes, not to be a general
 * kill-switch — a bug in this code must never lock users out of the app.
 */

export type UpdateStatus = 'blocked' | 'nudge' | 'ok';

/**
 * A version is valid only if EVERY dot-segment is purely numeric (optional
 * leading "v"). Used by evaluateUpdateStatus as a strict gate before the
 * lenient compareVersions runs — "2broken.0.0" must be treated as invalid,
 * not as 2.0.0 (fail-open).
 */
export function isValidVersion(v: string): boolean {
  const stripped = v.trim().replace(/^v/i, '');
  if (stripped.length === 0) return false;
  return stripped.split('.').every((segment) => /^\d+$/.test(segment));
}

/**
 * Compare two version strings by numeric segments (e.g. "1.10.0" > "1.2.3").
 * - A leading "v" is stripped (e.g. "v1.2.3" → "1.2.3").
 * - Missing segments are treated as 0 (e.g. "1.2" vs "1.2.0" → equal).
 * - Non-numeric segments are treated as 0 (fail-open — never throws).
 *
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const normalize = (v: string) =>
    v
      .trim()
      .replace(/^v/i, '')
      .split('.')
      .map((segment) => {
        const n = Number.parseInt(segment, 10);
        return Number.isFinite(n) ? n : 0;
      });

  const segmentsA = normalize(a);
  const segmentsB = normalize(b);
  const length = Math.max(segmentsA.length, segmentsB.length);

  for (let i = 0; i < length; i++) {
    const segA = segmentsA[i] ?? 0;
    const segB = segmentsB[i] ?? 0;
    if (segA < segB) return -1;
    if (segA > segB) return 1;
  }
  return 0;
}

export type EvaluateUpdateStatusInput = {
  current: string | null;
  minVersion?: string | null;
  recommendedVersion?: string | null;
};

/**
 * Decide the update status for the current app version against remote
 * config. Fail-open: any missing/null value resolves toward 'ok' rather than
 * blocking the user.
 */
export function evaluateUpdateStatus(input: EvaluateUpdateStatusInput): UpdateStatus {
  const { current, minVersion, recommendedVersion } = input;

  // Strict validity gate (fail-open): a malformed CURRENT version can't be
  // compared, and a malformed REMOTE threshold must never block anyone —
  // compareVersions' lenient parseInt would accept "2broken" as 2.
  if (!current || !isValidVersion(current)) return 'ok';

  if (minVersion && isValidVersion(minVersion) && compareVersions(current, minVersion) < 0) {
    return 'blocked';
  }

  if (
    recommendedVersion &&
    isValidVersion(recommendedVersion) &&
    compareVersions(current, recommendedVersion) < 0
  ) {
    return 'nudge';
  }

  return 'ok';
}

export type CheckForceUpdateDeps = {
  /** Fetches `{ min_version, recommended_version }`-shaped config, or null on any failure. */
  fetchConfig: () => Promise<Record<string, string> | null>;
  /** The app's current installed version (e.g. Application.nativeApplicationVersion). */
  currentVersion: string | null;
  /** Test/QA override — takes precedence over the real fetch (e.g. EXPO_PUBLIC_FORCE_UPDATE_TEST). */
  testOverride?: string;
};

const FETCH_TIMEOUT_MS = 3000;

/**
 * Fail-open async check: resolves to 'blocked' | 'nudge' | 'ok'. NEVER
 * throws and NEVER blocks the user due to a network error, missing table,
 * or slow response — anything but a clean, fast, valid config read
 * resolves to 'ok'.
 */
export async function checkForceUpdate(deps: CheckForceUpdateDeps): Promise<UpdateStatus> {
  const { fetchConfig, currentVersion, testOverride } = deps;

  if (testOverride === 'blocked' || testOverride === 'nudge') {
    return testOverride;
  }

  try {
    const config = await Promise.race([
      // .catch inside the race: a rejection AFTER the timeout wins would otherwise
      // surface as an unhandled promise rejection (the outer try only guards the winner).
      fetchConfig().catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)),
    ]);

    if (!config) return 'ok';

    return evaluateUpdateStatus({
      current: currentVersion,
      minVersion: config.min_version,
      recommendedVersion: config.recommended_version,
    });
  } catch {
    // Any error (network, parsing, missing table, RLS denial) — fail open.
    return 'ok';
  }
}
