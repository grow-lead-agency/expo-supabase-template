# ADR-003: Chunked expo-secure-store adapter for Supabase session

**Status:** Accepted
**Date:** 2026-05-28
**Linear:** PROD-2695

## Context

Supabase JS client needs a storage adapter to persist auth session (JWT + refresh token) across app restarts. Default in mobile examples is `@react-native-async-storage/async-storage`.

Two problems with AsyncStorage:
1. **Plain text on disk.** Android filesystem accessible to other apps with root / unencrypted backups → JWT theft surface.
2. **PostHog already imports AsyncStorage transitively.** Adding it for session storage compounds the leak surface.

`expo-secure-store` uses Keychain (iOS) and EncryptedSharedPreferences/Keystore (Android) — hardware-backed encryption. BUT Android has a hard 2 KB limit per key. Supabase sessions with long JWT claims exceed 2 KB.

## Decision

Use **`expo-secure-store` with a chunked adapter** (`src/lib/storage/secure-chunked.ts`) as the Supabase `storage` adapter. The adapter splits values >2 KB into N keys (`{key}_part_0`, `{key}_part_1`, ...) and reassembles on read.

NEVER use AsyncStorage for session/auth data. AsyncStorage is allowed for non-sensitive UI state only (and is already pulled in by PostHog for its own purposes, which is acceptable).

## Consequences

- **Positive:**
  - JWT + refresh tokens hardware-encrypted (Secure Enclave on iOS, Keystore on Android).
  - No 2 KB ceiling — chunked adapter handles any payload size.
  - Defense in depth even if device is lost/rooted.
- **Negative:**
  - Slightly slower reads (multiple Keychain ops for large sessions).
  - Adapter is custom code → must be tested against Supabase session lifecycle (sign in, refresh, sign out).
- **Neutral:**
  - One more lib in the dep tree (`expo-secure-store`, ~30 KB).

## Alternatives considered

- **AsyncStorage default:** Rejected — plain text, not acceptable for production GrowLead clients.
- **`expo-sqlite/localStorage/install`** (Expo SDK 56 official recommendation): Rejected — better than AsyncStorage but still no hardware encryption. SecureStore is the higher bar.
- **MMKV with encryption key:** Rejected — fast but key management responsibility shifts to us; SecureStore solves this natively.
