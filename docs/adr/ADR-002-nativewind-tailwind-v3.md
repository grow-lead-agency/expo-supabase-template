# ADR-002: NativeWind v4 + Tailwind v3.4 (NOT v4)

**Status:** Accepted
**Date:** 2026-05-28
**Linear:** PROD-2695

## Context

GrowLead web stack uses Tailwind everywhere (cf-tool-template, gl-app-template, gl-microsite-template). Mobile should match for muscle memory + design token reuse.

Options:
1. **NativeWind v4** + Tailwind v3.4 — production-stable, large community
2. **NativeWind v5-preview** + Tailwind v4 — bleeding edge
3. **Tamagui** — performance-focused, own DSL
4. **Gluestack UI** — semantic component library
5. **StyleSheet.create** — bare React Native

Tailwind v4 changed config format (CSS-based instead of JS) and broke NativeWind v4 compatibility. NativeWind v5 is still preview (pre-release).

## Decision

**Pin** Tailwind to `^3.4` in `package.json` and use **NativeWind v4** for styling. ALL components style via `className="..."` — no `StyleSheet.create`.

## Consequences

- **Positive:**
  - Identical class syntax to web stack (`flex flex-row items-center gap-2 px-4`).
  - Design tokens (colors, spacing) share `tailwind.config.js` shape with web.
  - AI agents trained on Tailwind produce correct mobile UI instantly.
  - No new DSL to learn (unlike Tamagui's `<XStack>` etc.).
- **Negative:**
  - Tailwind v4's CSS-config (cleaner) unavailable until NativeWind v5 stabilizes.
  - Some Tailwind utilities don't have RN equivalents (e.g. `backdrop-blur` needs `expo-blur` view).
- **Neutral:**
  - Tailwind v3.4 → v4 upgrade tracked separately as future ADR when NativeWind v5 ships.

## Alternatives considered

- **Tamagui:** Rejected — own DSL, no Tailwind familiarity, optimizer adds build complexity.
- **Gluestack UI:** Rejected — opinionated component library; we want utility-first, components built in-house.
- **StyleSheet.create:** Rejected — verbose, no design system enforcement, no AI-friendly autocomplete.
- **NativeWind v5-preview + Tailwind v4:** Rejected — pre-release, breaking changes likely.
