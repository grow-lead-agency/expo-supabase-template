/**
 * Unit tests for the force-update gate logic (PROD-5165 / ADR-010).
 * Pure TS, bun:test — no react-native / expo-application / supabase imports
 * (force-update.ts is deliberately dependency-injected for this reason).
 */
import { describe, expect, it } from 'bun:test';
import { checkForceUpdate, compareVersions, evaluateUpdateStatus } from './force-update';

describe('compareVersions', () => {
  it('compares numeric segments, not lexically (1.10.0 > 1.2.3)', () => {
    expect(compareVersions('1.10.0', '1.2.3')).toBe(1);
    expect(compareVersions('1.2.3', '1.10.0')).toBe(-1);
  });

  it('treats equal versions as 0', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('strips a leading "v" prefix', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('V2.0.0', '1.9.9')).toBe(1);
  });

  it('treats a missing segment as 0 (1.2 === 1.2.0)', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.2', '1.2.1')).toBe(-1);
    expect(compareVersions('2', '1.9.9')).toBe(1);
  });

  it('treats a non-numeric segment as 0 (fail-open, never throws)', () => {
    expect(() => compareVersions('1.x.0', '1.0.0')).not.toThrow();
    expect(compareVersions('1.x.0', '1.0.0')).toBe(0);
    expect(compareVersions('abc', '0.0.1')).toBe(-1);
  });

  it('handles empty/garbage strings without throwing', () => {
    expect(() => compareVersions('', '')).not.toThrow();
    expect(compareVersions('', '')).toBe(0);
  });
});

describe('evaluateUpdateStatus', () => {
  it('returns blocked when current < minVersion', () => {
    expect(
      evaluateUpdateStatus({ current: '1.0.0', minVersion: '1.1.0', recommendedVersion: null }),
    ).toBe('blocked');
  });

  it('returns nudge when current >= minVersion but < recommendedVersion', () => {
    expect(
      evaluateUpdateStatus({
        current: '1.1.0',
        minVersion: '1.0.0',
        recommendedVersion: '1.2.0',
      }),
    ).toBe('nudge');
  });

  it('returns ok when current satisfies both min and recommended', () => {
    expect(
      evaluateUpdateStatus({
        current: '1.2.0',
        minVersion: '1.0.0',
        recommendedVersion: '1.2.0',
      }),
    ).toBe('ok');
  });

  it('blocked takes precedence over nudge when both thresholds are missed', () => {
    expect(
      evaluateUpdateStatus({
        current: '0.5.0',
        minVersion: '1.0.0',
        recommendedVersion: '1.2.0',
      }),
    ).toBe('blocked');
  });

  it('fails open to ok when current is null', () => {
    expect(
      evaluateUpdateStatus({ current: null, minVersion: '9.9.9', recommendedVersion: '9.9.9' }),
    ).toBe('ok');
  });

  it('fails open to ok when minVersion/recommendedVersion are null or undefined', () => {
    expect(evaluateUpdateStatus({ current: '1.0.0' })).toBe('ok');
    expect(
      evaluateUpdateStatus({ current: '1.0.0', minVersion: null, recommendedVersion: null }),
    ).toBe('ok');
  });

  it('fails open to ok when minVersion/recommendedVersion are empty strings', () => {
    expect(evaluateUpdateStatus({ current: '1.0.0', minVersion: '', recommendedVersion: '' })).toBe(
      'ok',
    );
  });
});

describe('checkForceUpdate', () => {
  it('testOverride="blocked" takes precedence over fetchConfig', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '0.0.0', recommended_version: '0.0.0' }),
      currentVersion: '9.9.9',
      testOverride: 'blocked',
    });
    expect(result).toBe('blocked');
  });

  it('testOverride="nudge" takes precedence over fetchConfig', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '0.0.0', recommended_version: '0.0.0' }),
      currentVersion: '9.9.9',
      testOverride: 'nudge',
    });
    expect(result).toBe('nudge');
  });

  it('an invalid testOverride value is ignored (falls through to real check)', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '0.0.0', recommended_version: '0.0.0' }),
      currentVersion: '9.9.9',
      // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid input for the test
      testOverride: 'garbage' as any,
    });
    expect(result).toBe('ok');
  });

  it('resolves to ok when fetchConfig throws (fail-open)', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => {
        throw new Error('network down');
      },
      currentVersion: '1.0.0',
    });
    expect(result).toBe('ok');
  });

  it('resolves to ok when fetchConfig returns null (e.g. table missing)', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => null,
      currentVersion: '1.0.0',
    });
    expect(result).toBe('ok');
  });

  it('resolves to ok when fetchConfig never resolves (timeout, fail-open)', async () => {
    const result = await checkForceUpdate({
      fetchConfig: () => new Promise(() => {}), // pending forever
      currentVersion: '1.0.0',
    });
    expect(result).toBe('ok');
  }, 5000);

  it('resolves to blocked for a real fetchConfig happy path below min_version', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '2.0.0', recommended_version: '2.0.0' }),
      currentVersion: '1.0.0',
    });
    expect(result).toBe('blocked');
  });

  it('resolves to nudge for a real fetchConfig happy path below recommended_version only', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '1.0.0', recommended_version: '2.0.0' }),
      currentVersion: '1.5.0',
    });
    expect(result).toBe('nudge');
  });

  it('resolves to ok for a real fetchConfig happy path at/above recommended_version', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '1.0.0', recommended_version: '2.0.0' }),
      currentVersion: '2.0.0',
    });
    expect(result).toBe('ok');
  });

  it('resolves to ok when currentVersion is null even if config would block', async () => {
    const result = await checkForceUpdate({
      fetchConfig: async () => ({ min_version: '9.9.9', recommended_version: '9.9.9' }),
      currentVersion: null,
    });
    expect(result).toBe('ok');
  });
});
