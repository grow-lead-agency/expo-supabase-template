# ADR-005: EAS Build/Submit over Fastlane / Xcode Cloud

**Status:** Accepted
**Date:** 2026-05-28
**Linear:** PROD-2695

## Context

Mobile build/sign/distribute options:
1. **EAS Build/Submit** (Expo) — managed cloud builds, signing handled, 3-tier profile pattern.
2. **Fastlane** — open-source, scripts in Ruby, requires Mac CI runner.
3. **Xcode Cloud** — Apple native, $14.99/mo per workflow tier, iOS-only.
4. **Bitrise / CircleCI mobile pipelines** — generic CI, you wire it all yourself.

Petr is a non-mobile-native dev. Signing/provisioning/certificates is the #1 mobile blocker. Fastlane shifts the problem to "learn Ruby + maintain match repo + own a Mac CI runner".

## Decision

**EAS Build for builds, EAS Submit for distribution.** 3-tier profile config in `eas.json`:
- `development` — internal distribution APK + dev client (for `bun run dev` over network)
- `preview` — internal distribution IPA, TestFlight-installable
- `production` — App Store-ready, auto-increments build number

Free tier is sufficient for internal GrowLead apps (~30 builds/mo). Upgrade to Production tier ($29/mo) only when a client app needs frequent App Store releases.

## Consequences

- **Positive:**
  - Zero signing setup — `eas credentials` auto-manages certs + provisioning profiles.
  - Cross-platform (iOS + Android same `eas.json`).
  - Cloud builds → no Mac required for CI runner.
  - Single auto-increment build number across both platforms (`appVersionSource: "remote"`).
- **Negative:**
  - Vendor lock-in to Expo's build infrastructure.
  - Free tier queue can be 10-20 min wait at peak hours; paid tier $29/mo if SLA needed.
  - Build env vars must be pre-pushed via `bin/eas-secrets.sh` (extra step vs local builds).
- **Neutral:**
  - If we ever leave EAS, `eas build --local` produces standard Xcode/Gradle output → exit path exists.

## Alternatives considered

- **Fastlane:** Rejected — Ruby toolchain + match repo overhead + need Mac runner. Not worth it for non-mobile-native team.
- **Xcode Cloud:** Rejected — iOS-only, ties everything to Apple infra, expensive per workflow.
- **Manual `xcodebuild` + `gradlew`:** Rejected — Petr would spend weeks debugging certificates.
