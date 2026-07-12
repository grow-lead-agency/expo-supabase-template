# ADR-009: Sentry wired by default (env-gated no-op)

**Status:** Accepted
**Date:** 2026-07-12
**Deciders:** Petr Rohan (via Fable 5 template review)

## Context

v1.0 shipped Sentry as a placeholder: an `initSentry()` helper existed but nothing called it, the Expo plugin was not registered, and the root layout was not wrapped. README claimed "production-grade (EAS, Sentry, RLS)" — the Sentry part was dead code. Meanwhile PostHog in the same template uses a different pattern: fully wired, env-gated no-op when unconfigured. Two patterns for the same problem, one of them non-functional.

## Decision

Wire Sentry **fully by default**, using the same env-gated pattern as PostHog:
- `initSentry()` called at root layout module load; silent no-op when `EXPO_PUBLIC_SENTRY_DSN` is empty.
- Root layout wrapped with Sentry, plus a global error boundary so unhandled render errors are captured instead of white-screening. (A `+not-found` route ships alongside as routing hygiene — related DX fix, not part of error capture itself.)
- `@sentry/react-native/expo` plugin registered in app config; source map upload activates only when Sentry auth is configured in EAS secrets.

Forks that never configure Sentry pay nothing; forks that do get error tracking by filling one env var — no code changes.

## Consequences

- **Positive:**
  - "Production-grade" claim becomes true; a fork cannot accidentally ship without error tracking *wiring*.
  - Error boundary improves UX even without Sentry (graceful fallback screen).
  - One consistent pattern (env-gated default-on) for all observability integrations.
- **Negative:**
  - Sentry SDK adds binary size even for forks that never enable it. Accepted — removal is a documented one-step opt-out, and the reverse (retrofitting) historically never happens.
  - Build-time plugin means prebuild output differs slightly from v1.0 forks.

## Alternatives considered

- **Keep opt-in placeholder:** Rejected — v1.0 proved opt-in wiring equals never wired; the claim in README was false for the entire template lifetime.
- **PostHog error tracking instead of Sentry:** Rejected — Sentry mobile SDK is materially deeper (native crashes, symbolication, release health); GrowLead already runs a Sentry org with sentry-mastery tooling.

## References
- PRD v1.1 §4 R2
- ADR-006 (PostHog env-gated pattern)
