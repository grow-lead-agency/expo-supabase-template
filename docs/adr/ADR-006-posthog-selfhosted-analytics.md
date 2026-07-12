# ADR-006: PostHog (self-hosted) for mobile analytics

**Status:** Accepted
**Date:** 2026-07-12 (backfill — decision made 2026-05-25, PLAN.md Q4; ADR written during v1.1 review)
**Linear:** PROD-2655

## Context

The template needs a product analytics layer. Decision was made in Phase 0 (PLAN.md Q4) but the ADR referenced from README/CLAUDE.md ("ADR-006 detail") was never written. This backfills it.

Requirements: EU data residency (CZ clients, GDPR), shared instance across GrowLead web + mobile projects, no per-seat SaaS cost for internal/agency apps.

## Decision

Use **PostHog self-hosted** on GrowLead's Coolify instance (`posthog.growlead.cz`) via `posthog-react-native`. The client is pre-wired in the template as an env-gated no-op: with an empty `EXPO_PUBLIC_POSTHOG_KEY`, all `posthog.capture()` calls are safe no-ops, so forks incur zero cost and zero crash risk until analytics is configured. Autocapture is disabled by default — events are designed per app.

## Consequences

- **Positive:**
  - Data stays on GrowLead infra (GDPR posture, no US processor for client apps by default).
  - One instance for web (cf-tool, gl-app) + mobile → unified dashboards.
  - $0/mo incremental per app.
- **Negative:**
  - Self-hosted PostHog maintenance burden sits with GrowLead ops (upgrades, disk).
  - No PostHog Cloud-only features (some replay/feature-flag tiers).

## Alternatives considered

- **Mixpanel / Amplitude:** Rejected — per-MTU pricing, US data residency friction, second vendor to manage.
- **PostHog Cloud EU:** Viable fallback if self-hosted maintenance becomes a burden; migration path is config-only (host + key swap).
- **No analytics in template:** Rejected — retrofitting analytics later never happens in practice.

## References
- PLAN.md — Phase 0, Q4
