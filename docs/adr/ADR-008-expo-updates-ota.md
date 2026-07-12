# ADR-008: expo-updates OTA as a template default

**Status:** Accepted
**Date:** 2026-07-12
**Deciders:** Petr Rohan (via Fable 5 template review)

## Context

v1.0 defined EAS Update channels (`development` / `preview` / `production`) in the build config, but `expo-updates` was never installed — channels reference nothing, and every JS-level fix requires a full store build + Apple review (days). For agency work, shipping a copy fix or logic hotfix to a client app within minutes is the single biggest operational lever a RN stack offers over native.

## Decision

Install **`expo-updates`** as a template default with:
- `runtimeVersion` policy `appVersion` — each store version defines its own OTA compatibility boundary; native module changes always go through a store build.
- Update scripts for preview and production channels (`eas update --channel ...`).
- Convention: OTA for JS/asset changes only; any dependency change touching native code = new store build. Documented in CLAUDE.md anti-patterns.

## Consequences

- **Positive:**
  - Hotfix latency drops from days (store review) to minutes.
  - Preview channel becomes a real stakeholder-testing loop (TestFlight build once, iterate via OTA).
  - EAS Free tier includes updates for our scale (internal/agency apps).
- **Negative:**
  - `runtimeVersion` discipline required — an OTA pushed against an incompatible native runtime crashes at startup. Mitigated by `appVersion` policy (conservative, version-scoped).
  - Slightly larger app binary and one more startup code path.
  - Apple guideline 3.3.2 constraints: OTA must not change the app's purpose — fine for fixes/iterations, not for feature smuggling.

## Alternatives considered

- **No OTA (store builds only):** Rejected — leaves the main RN operational advantage on the table; channels in eas.json were already promising it.
- **Self-hosted updates server:** Rejected — maintenance burden for zero benefit at our scale; EAS hosting is included.
- **`runtimeVersion: fingerprint` policy:** Deferred — more precise (hash of native code), but adds CI complexity; revisit if `appVersion` proves too coarse.

## References
- PRD v1.1 §4 R4
- eas.json channels (v1.0)
