# ADR-004: Magic link as default auth, Sign in with Apple additive

**Status:** Accepted
**Date:** 2026-05-28
**Linear:** PROD-2695

## Context

Mobile auth on iOS has multiple paths:
1. **Email + password** — universal, no integrations, but UX friction (forgot-password flows).
2. **Magic link (passwordless)** — Supabase first-class, just email entry.
3. **Sign in with Apple** — REQUIRED by Apple if you offer ANY social login. Slick UX.
4. **Google OAuth** — universal but more setup.
5. **Phone OTP** — friction for international, SMS costs.

App Store Review Guideline 4.8 mandates: if you offer login with Google/Facebook/etc., you MUST also offer Sign in with Apple. Email/password and magic link are exempt.

## Decision

**Magic link is the default auth flow** in this template. Sign in with Apple is **pre-wired as additive** (one-tap if user prefers) but not required to ship a first internal version.

When a client adds Google/Facebook OAuth → MUST add Sign in with Apple at the same time (App Store gate).

## Consequences

- **Positive:**
  - Lowest friction signup (one screen, one input).
  - No password storage / reset infrastructure needed.
  - Sign in with Apple optional → can ship to internal TestFlight without Apple Developer Sign-in-with-Apple capability configured.
- **Negative:**
  - Magic link UX requires email deep-link → Supabase redirect URL configuration is critical (`{scheme}://auth/callback`).
  - Some users distrust email links; expect ~5-10% drop-off vs Sign in with Apple one-tap.
- **Neutral:**
  - Phone OTP available as future addition for clients with non-email customer base.

## Alternatives considered

- **Email + password default:** Rejected — friction (password rules, forgot-password screens, breach exposure).
- **Sign in with Apple only:** Rejected — locks out Android users + non-Apple-ID-having edge cases.
- **OAuth (Google) default:** Rejected — triggers App Store mandatory Sign in with Apple requirement immediately, more setup.
