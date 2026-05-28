# ADR-001: Expo Router v5 (file-based) over React Navigation imperative

**Status:** Accepted
**Date:** 2026-05-28
**Linear:** PROD-2695

## Context

React Native apps need a navigation library. Two dominant approaches:

1. **React Navigation** (imperative): Define stacks/tabs in code via JS objects, navigate via `navigation.navigate('Screen')`. Industry standard since 2017.
2. **Expo Router v5** (declarative, file-based): Files in `app/` become routes, layouts via `_layout.tsx`. Mirrors Next.js App Router pattern.

Petr's primary background is React/Next.js (App Router daily driver). Onboarding a non-mobile-native engineer to React Navigation imperative API has high cognitive cost.

## Decision

Adopt **Expo Router v5** as the routing layer. File-based routing in `src/app/`, with route groups `(auth)` and `(app)` for guard-based segmentation.

## Consequences

- **Positive:**
  - Conceptually identical to Next.js App Router (Petr's daily stack) → near-zero learning curve.
  - File tree IS the navigation map → instantly readable for AI agents and humans.
  - Typed routes via `experiments.typedRoutes: true` (in app.json).
  - Deep linking config derived from file structure automatically.
- **Negative:**
  - Less Stack Overflow corpus than React Navigation (mitigated by Expo's own docs being excellent).
  - Some advanced patterns (custom transitions, modal-over-tabs) require slight workarounds.
- **Neutral:**
  - Internally Expo Router still uses React Navigation, so escape hatches exist if needed.

## Alternatives considered

- **React Navigation 7:** Rejected — imperative API, manually wired stacks, no convention for protected routes.
- **Solito (universal routing):** Rejected — over-engineering for mobile-only apps; not needed unless we share routing with Next.js.
