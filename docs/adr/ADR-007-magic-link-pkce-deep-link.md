# ADR-007: PKCE deep-link completion for magic link auth

**Status:** Accepted
**Date:** 2026-07-12
**Deciders:** Petr Rohan (via Fable 5 template review)
**Extends:** ADR-004 — Supabase magic link as default auth

## Context

ADR-004 made magic link the default auth method, but v1.0 shipped only the *sending* half: `signInWithOtp` with a hardcoded `myapp://auth/callback` redirect that the setup script never replaces, and **no deep-link handler** anywhere in the app — no callback route, no token exchange. The default login flow cannot be completed on a device. This was undetected because Phase 8 (end-to-end smoke test) never ran a real fork → login cycle.

Two design questions: (a) which OAuth flow variant for the email link, (b) how the app derives its redirect URL.

## Decision

1. **PKCE flow** (`flowType: 'pkce'` on the Supabase client). The email link carries a one-time code; the app exchanges it for a session in a dedicated deep-link callback route. PKCE is Supabase's recommended flow for mobile — tokens never appear in the URL fragment, and the exchange is bound to the initiating device.
2. **Runtime-derived redirect URL** via Expo Linking (`Linking.createURL('auth/callback')`), which reads the scheme from app config. This removes the hardcoded placeholder and the fragile sed replacement in the setup script entirely — the redirect is always correct for whatever scheme the fork configured.
3. **Supabase allowlist step** added to FIRST-FORK-RUNBOOK: the fork's scheme URL must be added to Supabase Auth → Redirect URLs, otherwise the link falls back to the site URL.
4. **OTP code entry as first-class fallback** (added after cross-review 2026-07-12): email link scanners (Outlook SafeLinks, Gmail prefetch) can consume single-use magic links before the user clicks, and in-app email browsers often break custom-scheme redirects. The sign-in "sent" state therefore also accepts the 6-digit OTP code from the same email (`verifyOtp`), which needs no deep link at all. Fork runbook: include `{{ .Token }}` in the Supabase magic link email template. This mirrors the base-reference starter (robertguss), which uses OTP-only for exactly this reason.

## Consequences

- **Positive:**
  - Default auth flow actually works end-to-end; template's core promise is real.
  - No per-fork string replacement in auth code — one less setup.sh failure mode.
  - PKCE is the more secure and forward-compatible Supabase flow (implicit flow is legacy).
- **Negative:**
  - One more runbook step (Supabase redirect allowlist) that cannot be automated without Supabase management API access.
  - Magic link testing requires a real device or simulator with deep-link support — covered by the Maestro smoke flow (PRD R5).
  - Deep-link delivery is inherently unreliable across email clients (scanners, in-app browsers) — mitigated by the OTP code fallback (decision #4), which is the guaranteed path.

## Alternatives considered

- **Implicit flow + token extraction from URL fragment:** Rejected — legacy pattern, tokens exposed in URL, Supabase docs steer mobile to PKCE.
- **Password auth as default instead:** Rejected — contradicts ADR-004 rationale (passwordless UX, no credential storage liability).
- **Keep sed replacement for redirect string:** Rejected — root cause of the v1.0 bug; runtime derivation is strictly better.

## References
- Supabase docs — Native Mobile Deep Linking / PKCE flow
- PRD v1.1 §4 R1
