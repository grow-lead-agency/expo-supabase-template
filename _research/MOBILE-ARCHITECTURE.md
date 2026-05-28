# Mobile Skills & Agents Ecosystem — Architecture

> Architect: system-designer | Date: 2026-05-25 | Status: DRAFT — requires Petr's review before build
> Scope: read-only architecture design. Definuje skill inventory, agent inventory, build order pro mobile development (iOS + Android) v GrowLead ekosystému.
> Trigger: Cutegory iOS (první projekt na obzoru) + příprava na další klientské mobile apps.

---

## 0. Executive Summary (TL;DR)

**Doporučený stack pro Cutegory iOS i většinu budoucích Petr's klientských mobile projektů: SwiftUI native (iOS) + Jetpack Compose (Android, až bude potřeba). NE cross-platform.**

Důvody (detail v §1):
1. Petr má premium klienty → native performance + platform-feel jsou diferenciátor, ne cost
2. Backend už je sjednocený (Supabase + CF Workers) → frontend duplikace 2 platforms je menší cost než React Native runtime debugging
3. AI agents (Claude Code) píší Swift / Kotlin stejně dobře jako TS — Petr's TS expertise není gating factor když agenti generují code
4. Cross-platform má lifetime tax (RN upgrade hell, Flutter Skia → Impeller migrace, JS bridge perf) — Cutegory je dlouhodobý produkt

**Fallback / cross-platform okno:**
- Expo + RN: prototypy < 4 weeks, internal tools, klient explicitně chce shared codebase
- Capacitor: kdy existuje hotový web app a klient chce app store presence (Cutegory backoffice → manager mobile app via Capacitor je možnost na §6.3)
- Flutter: NEDOPORUČUJI — Dart skill cost je nesplatitelný proti malé množině projektů

**Skill investment scope:**
- **P0 (před Cutegory iOS první týden):** 6 skills (~6 dní work pro AI agenta) — viz §5
- **P1 (během prvního projektu):** 8 skills přidaných as-needed
- **P2 (až přijde 2. mobile projekt):** Android + cross-platform skills

**Skill count finální:** 24 nových mobile skills + 4 nové agents + 3 extensions existujících (review-fleet, qa-fleet, deploy-agent).

---

## 1. Strategy & Scope

### 1.1 Native vs Cross-Platform — Decision Framework

```
START → Je projekt single-platform po dobu ≥ 12 měsíců?
  YES → NATIVE (Swift/SwiftUI nebo Kotlin/Compose)
  NO  → Je primary platforma iOS A klient chce App Store presence?
    YES → Má backend hodně realtime/native APIs (camera, AR, HealthKit, ApplePay)?
      YES → NATIVE
      NO  → Existuje hotový web app v Petr's stacku (React + Vite)?
        YES → CAPACITOR (wrap existing web, ship za 1-2 týdny)
        NO  → EXPO + RN (sdílený TS codebase, EAS Build)
    NO  → EXPO + RN (default cross-platform pro nové projekty)
```

**Hranice native vs cross:**
- **Native wins když:** premium UX, hluboké platform APIs (Live Activities, Widgets, ARKit, HealthKit, Apple Pay, CarPlay, Watch), App Store rating > 4.5★ cíl, lifetime ≥ 2 roky, klient platí za polish
- **Cross-platform wins když:** time-to-market < 6 týdnů, MVP / proof-of-concept, shared business logic s webem (≥ 60 % overlap), klient nemá App Store ambici (jen "máme apku")
- **Capacitor wins když:** existující React/Vite web app, klient chce "mobile" za nejmenší cost, push notifications jsou jediný native feature

### 1.2 Petr's Profile vs Mobile Reality

| Petr's strength | Mobile relevance | Implication |
|---|---|---|
| TS + React expertise | Cross-platform via RN/Capacitor | False saving — RN má JS bridge perf cliff + native module hell |
| Bun + Vite stack | Web tooling | Nepřenosné na mobile build (Xcode/Gradle jsou GIVEN) |
| Solo dev + AI agents | AI generates Swift/Kotlin stejně dobře | Language not blocker — toolchain is |
| Supabase + CF Workers backend | Universal across platforms | ✅ Backend zůstává, jen klient se mění |
| Premium klienti (Cutegory, EventHero) | Očekávají native feel | Tlačí na native iOS |
| Linear + PMRS pattern | Multi-repo workflow | Mobile = další sub-repo (cutegory-ios) v PMRS |

**Závěr:** Petr's stack expertise je v backendu + designu + orchestraci, ne v mobilním frontendu specificky. AI agents kompenzují language gap. Investice do **toolchain skills** (Xcode automation, Fastlane, App Store Connect API) má vyšší ROI než cross-platform "save".

### 1.3 ROI: kolik investovat před prvním projektem?

**Anti-pattern:** Postavit 24 skills před prvním commitem Cutegory iOS. To je 3+ týdny investice s nejistou návratností.

**Doporučení:** P0 (6 skills, ~6 dní AI work) je minimum viable. Cokoliv víc je premature optimization. Mobile skills se postaví **as-needed během prvního projektu** — Claude Code dispatch model umožňuje "pause & build skill, then resume".

Break-even point: skill se začne vyplácet od **2. použití**. P0 skills použiješ 5-10× během Cutegory iOS samotné, P1 skills 2-3×, P2 skills 1× (proto čekají na 2. projekt).

---

## 2. Skill Inventory

Skill struktura: `agents-and-skills/skills/mobile/{name}/SKILL.md`. Nová top-level kategorie **`mobile/`** sibling k `dev/`, `design/`, `ux-design/`.

Sub-kategorie:
- `mobile/ios/` — iOS native (Swift, SwiftUI, Xcode)
- `mobile/android/` — Android native (Kotlin, Compose, Gradle)
- `mobile/cross-platform/` — RN, Flutter, Capacitor, Expo
- `mobile/store/` — App Store + Play Store
- `mobile/services/` — push, IAP, auth, analytics, crash, deep-linking (cross-platform services)
- `mobile/quality/` — testing, performance, accessibility, security
- `mobile/design/` — HIG, Material 3, design tokens cross-platform
- `mobile/ci/` — Fastlane, Xcode Cloud, EAS Build, GitHub Actions macOS

### 2.1 P0 — Must-have před Cutegory iOS (6 skills)

| # | Skill | Path | Účel | Triggery | Závisí na |
|---|---|---|---|---|---|
| 1 | **ios-master** | `mobile/ios/ios-master/` | Top-level orchestrator pro iOS dev — Swift, SwiftUI, project setup, dependencies (SPM), Xcode build basics. Routing do sub-skills. | "ios", "iOS app", "swiftui", "swift", "iphone app", "nativní iOS" | dev-skill, stack-rules |
| 2 | **swiftui-patterns** | `mobile/ios/swiftui-patterns/` | SwiftUI komponenty, NavigationStack, state (`@State`/`@Observable` macro iOS 17+), async/await, lifecycle, sheet/fullScreenCover, list patterns | "swiftui", "navigationstack", "observable", "@state" | ios-master |
| 3 | **xcode-toolchain** | `mobile/ios/xcode-toolchain/` | xcodebuild CLI, project.pbxproj surgery (přes XcodeGen nebo Tuist), schemes, build settings, code signing setup, simulator management. Pokrývá xcrun + altool + Transporter. | "xcode build", "xcodebuild", "code signing", "provisioning", "simulator" | ios-master |
| 4 | **apple-developer-program** | `mobile/store/apple-developer-program/` | Apple Developer account workflow: enrollment, App ID + bundle ID, certificates (dev/dist/push), provisioning profiles, App Store Connect users, Transfer apps, DUNS pro orgs | "apple developer", "provisioning", "certificate", "appstoreconnect", "bundle id" | — |
| 5 | **app-store-submit** | `mobile/store/app-store-submit/` | App Store Connect API + metadata: app records, screenshots specs (6.7", 6.5", 5.5"), privacy nutrition labels, age rating, export compliance, TestFlight workflow (internal + external), submission + review process | "app store", "testflight", "submit ios", "privacy nutrition", "screenshots" | apple-developer-program |
| 6 | **fastlane-mobile** | `mobile/ci/fastlane-mobile/` | Fastlane setup pro iOS + Android: match (cert syncing přes private git), gym (build), pilot (TestFlight upload), deliver (App Store metadata), supply (Play Store). Includes lanes pattern + Appfile/Fastfile examples. | "fastlane", "match", "gym", "pilot", "deliver" | xcode-toolchain |

**Rationale pro P0:**
- 1 + 2 = můžeš psát app (SwiftUI patterns + ios-master routing)
- 3 = můžeš ji buildit (Xcode toolchain)
- 4 = můžeš ji podepsat (Apple Dev Program)
- 5 = můžeš ji shipnout (App Store + TestFlight)
- 6 = automatizace všeho výše (Fastlane je glue)

Bez kteréhokoliv ze 6 zůstaneš zaseknutý. S nimi máš end-to-end pipeline pro Cutegory iOS MVP.

### 2.2 P1 — Brzy během prvního projektu (8 skills)

| # | Skill | Path | Účel | Závisí na |
|---|---|---|---|---|
| 7 | **swift-openapi-codegen** | `mobile/ios/swift-openapi-codegen/` | swift-openapi-generator (Apple official) workflow: OpenAPI spec → typed Swift client. Plugin pro SPM, runtime, URLSession transport, error mapping. | ios-master, api-mastery |
| 8 | **supabase-swift** | `mobile/ios/supabase-swift/` | supabase-swift SDK: auth (Sign in with Apple + Magic Link via Universal Links), realtime, storage, database queries, session sharing across SwiftUI views, Keychain token storage | ios-master, auth-master |
| 9 | **ios-push-apns** | `mobile/services/ios-push-apns/` | APNs setup (.p8 key vs .p12 cert, prefer .p8), APNS payload, UNUserNotificationCenter, notification categories + actions, rich notifications, background notifications, silent push, push troubleshooting | ios-master, apple-developer-program |
| 10 | **sign-in-with-apple** | `mobile/services/sign-in-with-apple/` | SIWA implementation: AuthorizationController, nonce + state, identityToken validation, server-side flow with Supabase auth, hide-my-email handling, account linking, App Store mandate (kdy je vyžadováno) | ios-master, supabase-swift |
| 11 | **ios-testing** | `mobile/quality/ios-testing/` | XCTest, Swift Testing (new in iOS 18), XCUITest, snapshot testing (pointfreeco/swift-snapshot-testing), test plans, parallel execution, code coverage, CI integration | ios-master, fastlane-mobile |
| 12 | **maestro-mobile-e2e** | `mobile/quality/maestro-mobile-e2e/` | Maestro YAML flows pro iOS + Android, Maestro Studio recording, cloud runs, CI integration. Preferred over Detox (RN only) a EarlGrey (iOS only). | ios-testing |
| 13 | **mobile-design-handoff** | `mobile/design/mobile-design-handoff/` | Figma → SwiftUI handoff: HIG compliance check, spacing/typography tokens, SF Symbols mapping, safe areas, dark mode variants, Dynamic Type scaling, Style Dictionary → Swift extension generation | ios-master, figma, design-pipeline |
| 14 | **sentry-mobile** | `mobile/services/sentry-mobile/` | Extension k existing `sentry-mastery`: Sentry iOS + Android SDK setup, dSYM upload (Fastlane integration), crash + performance tracing, breadcrumbs, user feedback widget, source maps (RN) | sentry-mastery |

### 2.3 P2 — Pro 2. mobile projekt + Android (10 skills)

| # | Skill | Path | Účel |
|---|---|---|---|
| 15 | **android-master** | `mobile/android/android-master/` | Kotlin + Jetpack Compose orchestrator, Material 3, ViewModels + Compose state, Hilt DI, Gradle Kotlin DSL, Android Studio workflow |
| 16 | **compose-patterns** | `mobile/android/compose-patterns/` | Jetpack Compose: state hoisting, side-effects (LaunchedEffect, rememberSaveable), navigation-compose, lazy lists, Material 3 theming |
| 17 | **gradle-toolchain** | `mobile/android/gradle-toolchain/` | Gradle Kotlin DSL, AGP version mgmt, signing configs, build variants, ProGuard/R8, version catalog (libs.versions.toml) |
| 18 | **play-store-submit** | `mobile/store/play-store-submit/` | Google Play Console: data safety, content rating (IARC), pre-launch report, internal/closed/open testing tracks, staged rollout, app bundle (AAB) |
| 19 | **android-push-fcm** | `mobile/services/android-push-fcm/` | FCM setup, Firebase project + google-services.json, FirebaseMessagingService, notification channels (Android 8+), data vs notification messages, topic subscriptions |
| 20 | **iap-storekit2** | `mobile/services/iap-storekit2/` | StoreKit 2 (iOS 15+): Product fetching, purchase + verification, Transaction.updates, App Store Server API, subscription groups, promotional offers, family sharing, refund handling |
| 21 | **iap-revenuecat** | `mobile/services/iap-revenuecat/` | RevenueCat cross-platform IAP wrapper: setup, entitlements, paywalls, webhooks → Supabase, A/B testing, integration s existing Stripe (web) pro unified subscription state |
| 22 | **react-native-expo** | `mobile/cross-platform/react-native-expo/` | Expo SDK 51+, EAS Build, EAS Update (OTA), expo-router, expo-image, expo-notifications, dev clients, EAS Submit |
| 23 | **capacitor-wrap** | `mobile/cross-platform/capacitor-wrap/` | Capacitor 6 wrap existing web app, plugins (camera, push, local notifications), live reload during dev, build pipeline (Xcode + Android Studio z webu) |
| 24 | **deep-linking-universal-links** | `mobile/services/deep-linking-universal-links/` | Universal Links (iOS, apple-app-site-association), App Links (Android, assetlinks.json), CF Workers hosting AASA/assetlinks pattern, magic-link auth flow, attribution (deferred deep links via Branch.io alt) |

### 2.4 Skills NEdoporučuju budovat (zatím)

| Skill | Důvod skip |
|---|---|
| **flutter** | Dart skill cost neopodstatněný — žádný klient si neřekl o Flutter, native + RN pokrývá 100 % use cases |
| **detox** | Maestro je better default (cross-platform, easier YAML, není RN-only) |
| **arkit** / **arcore** | Žádný projekt to nepotřebuje, build když přijde request |
| **wearos** / **carplay** / **watchos** | Build když přijde feature request, ne preventivně |
| **android-tv** / **android-auto** | Niche, build on demand |
| **kotlin-multiplatform** | Trh ještě nestabilní, ROI nejistý — počkat 12 měsíců |
| **stripe-on-mobile** (separate) | `stripe` skill už existuje, integrace přes RevenueCat nebo přímo web checkout via SFSafariViewController stačí |

### 2.5 Skill upgrades (extensions existujících)

| Existing skill | Mobile extension | Co přidat |
|---|---|---|
| `sentry-mastery` | reference `mobile-setup.md` | iOS + Android SDK setup, dSYM upload, source maps RN |
| `auth-master` | reference `mobile-flows.md` | SIWA, Google Sign-In, Supabase mobile session, biometric (Face ID/Touch ID/biometric prompt Android) |
| `figma` | reference `mobile-handoff.md` | iOS/Android specs, SF Symbols mapping, Material icons |
| `api-mastery` | reference `mobile-codegen.md` | swift-openapi-generator + OpenAPI Generator Kotlin pattern |
| `i18n-master` | reference `mobile-localization.md` | Localizable.xcstrings (Xcode 15+), strings.xml + AGP translation pipeline, Crowdin/Lokalise integration |
| `stack-rules` | new section "Mobile project rules" | bundle ID convention, version+build number strategy, semantic versioning na mobile, minimum OS version policy |

### 2.6 Granularita decision — proč 24 skills a ne 8 mega-masters

**Argumenty pro granularitu:**
- Claude Code skill loading je on-demand (`Skill` tool) → 24 fokusovaných je levnější na load než 8 mega
- Updates: SwiftUI mění syntax v každé verzi → `swiftui-patterns` update neovlivní `apple-developer-program`
- Reuse: `fastlane-mobile` se použije v iOS + Android + RN projektech, kdyby byl uvnitř `ios-master` musí se duplikovat
- Audit: jednodušší ověřit jeden skill je up-to-date

**Argumenty pro mega-master:**
- Méně discovery overhead (jeden trigger, vše uvnitř)
- Pro solo dev jednodušší mental model

**Kompromis:** `ios-master` + `android-master` jako routing entry points → routing do sub-skills. Stejný pattern jako `meta-master → meta-pixel-capi`.

---

## 3. Agent Inventory

4 noví agents + 3 extensions existujících.

### 3.1 mobile-master (top-level router)

```yaml
name: mobile-master
description: Top-level router pro mobile development (iOS, Android, cross-platform). Aktivuje se na "mobile app", "iOS app", "Android app", "nativní app", "appka", "app store", "play store", "swift", "kotlin", "react native", "flutter", "capacitor", "expo". Routuje do ios-master / android-master / cross-platform skills.
model: sonnet
tools: Read, Glob, Grep, Bash, Skill, mcp__linear__*, mcp__github__*
```

System prompt obsahuje:
- Decision tree native vs cross (z §1.1)
- Routing matrix → konkrétní skill
- Bridge na `dev-pipeline` agenta (po architecture rozhodnutí jde sem)
- Bridge na `design-pipeline` (UX/HIG/Material handoff)

**Pozice:** sibling k `dev-pipeline.md`, `design-pipeline.md`. NE replace — mobile pipeline volá `dev-pipeline` pro common phases (PR, review, deploy gating).

### 3.2 ios-architect

```yaml
name: ios-architect
description: Solutions architect pro iOS apps. Aktivuje se na "iOS architecture", "swift architecture", "ios system design", "ios architektura". Produkuje iOS-specific ARCHITECTURE.md (modul split, navigation, state management, data layer, networking, security model).
model: opus
tools: Read, Glob, Grep, Skill
```

Sibling k `frontend-architect`, `backend-architect`. Readonly — produkuje docs/MOBILE-ARCHITECTURE.md per project (e.g. cutegory-ios). Volá `ios-master` skill pro patterns reference.

### 3.3 android-architect (P2)

Mirror k `ios-architect`. Build když 1. Android projekt přijde.

### 3.4 mobile-deploy-agent

```yaml
name: mobile-deploy-agent
description: Mobile release orchestrator — TestFlight upload, App Store submission, Play Console internal track, staged rollout. Aktivuje se na "ship ios", "release app", "testflight upload", "submit to store", "ship android". Volá fastlane-mobile + app-store-submit + play-store-submit skills.
model: sonnet
tools: Bash, Read, Skill, mcp__linear__*, mcp__github__*
```

**Pozice:** sibling k `deploy-agent`. NEpřebírá web deploy. Specializovaný workflow:
1. Pre-flight check (cert validity, provisioning, version bump, changelog)
2. Build via Fastlane (gym/gradle)
3. Upload (pilot pro TestFlight, supply pro Play internal)
4. Slack/Telegram notify
5. Submit pro review (delegovat klientovi nebo auto-submit) 
6. Linear issue update + git tag

### 3.5 app-store-submitter

```yaml
name: app-store-submitter
description: App Store Connect + Play Console metadata workflow — screenshots upload, privacy nutrition labels, data safety form, age rating, localized descriptions, what's new, review notes. Aktivuje se na "app store metadata", "privacy labels", "screenshots upload", "data safety". 
model: sonnet
tools: Bash, Read, Write, Edit, Skill, mcp__firecrawl__* (pro guideline lookups)
```

Sub-agent volaný z `mobile-deploy-agent`. Možno použít standalone když Petr potřebuje jen updatovat metadata.

### 3.6 mobile-review-fleet (extension existing)

NE nový agent — extension `review-fleet` agenta. Přidat checks:
- iOS: HIG compliance, accessibility (VoiceOver labels, Dynamic Type), memory cycles (weak references), main thread violations, App Tracking Transparency compliance, deprecation warnings
- Android: Material 3 compliance, ANR risk patterns, leak suspects (LeakCanary patterns), permissions audit
- Cross: secrets in code (Bundle ID + API keys hardcoded), Sentry coverage, deep link handler safety

Implementace: nový file `review-fleet/references/mobile-patterns.md` + entry v review-fleet agent prompt routing tabulce.

### 3.7 mobile-qa-fleet (extension existing)

NE nový agent — extension `qa-fleet` / `test-fleet` agenta. Přidat:
- iOS XCTest + XCUITest run via Fastlane scan
- Maestro flows execution
- Snapshot testing diff reporting
- Performance tests (XCTMetric)
- Coverage threshold enforcement

Reference: `qa-fleet/references/mobile-testing.md` + routing entry.

---

## 4. Integration s existujícím ekosystémem

### 4.1 Pipeline navigation

```
Existing web pipeline:
  prd-writer → system-designer → frontend-architect → dev-pipeline → review-fleet → deploy-agent

New mobile pipeline:
  prd-writer → system-designer → ios-architect (or android-architect)
       ↓
  mobile-master (routing)
       ↓
  dev-pipeline (REUSE — PR workflow, Linear sync, conventional commits — všechno platform-agnostic)
       ↓
  review-fleet (with mobile-patterns reference) — REUSE
       ↓
  mobile-deploy-agent (NEW — separate from web deploy-agent)
       ↓
  app-store-submitter (NEW)
```

**Klíčové insight:** Mobile NE-překrývá `dev-pipeline` — PR workflow, Linear, git, code review jsou universal. Mobile fork je až v **build + deploy fázi** (Xcode/Gradle build ≠ wrangler deploy).

### 4.2 Design handoff

`design-pipeline` agent → mobile context:
- Pro web: `ux-design/web-pipeline` (existing)
- Pro mobile: rozšířit `design-pipeline` o routing `→ mobile-design-handoff` skill když projekt = mobile

Figma plugin workflow:
- Design Tokens Studio → Style Dictionary → generate Swift extension + Compose theme
- Existing `figma` skill + new `mobile-design-handoff` skill = handoff pipeline

### 4.3 PMRS pattern aplikovaný na Cutegory

```
Cutegory/
├── platform.yaml           # registry: 7 sub-repos (přidat cutegory-ios)
├── cutegory-backoffice/    # Next.js (web)
├── cutegory-hub/           # auth gateway
├── cutegory-docs/          # ⭐ SHARED — OpenAPI spec, design tokens, brand guidelines
├── cutegory-mcp/
├── cutegory-pi-client/
├── cutegory-www-stripper/
└── cutegory-ios/           # NEW — Swift/SwiftUI native iOS app
    ├── CutegoryApp.xcodeproj  (or Tuist project)
    ├── App/
    ├── Features/
    ├── Networking/         # swift-openapi-generator output, references cutegory-docs/openapi.yaml
    ├── DesignSystem/       # generated from cutegory-docs/design-tokens.json via Style Dictionary
    └── fastlane/
```

OpenAPI contract sdílený přes `cutegory-docs/openapi.yaml`. iOS generuje Swift client. Backoffice generuje TS client. Single source of truth = backend spec.

Design tokens sdílené přes `cutegory-docs/design-tokens.json`. Web čte přes Tailwind config, iOS čte přes Style Dictionary → Swift extensions.

### 4.4 Backend integration mapping

| Backend service | Web access | iOS access | Skill bridge |
|---|---|---|---|
| Supabase Auth | supabase-js | supabase-swift | auth-master + supabase-swift |
| Supabase Postgres (RLS) | supabase-js | supabase-swift | (existing) |
| Supabase Storage | supabase-js | supabase-swift | (existing) |
| Supabase Realtime | supabase-js channel | supabase-swift channel | (existing) |
| CF Worker API | fetch | swift-openapi-generated client | swift-openapi-codegen + api-mastery |
| Sentry | @sentry/browser | sentry-cocoa | sentry-mastery + sentry-mobile ref |
| Stripe (web checkout) | @stripe/stripe-js | SFSafariViewController nebo RevenueCat | stripe + iap-revenuecat |
| Resend | api call from worker | (n/a, worker odesílá) | — |

### 4.5 Payments — Stripe vs StoreKit decision

Apple guideline 3.1.1 mandátuje IAP pro digital goods consumed v appce. Klíčová pravidla:
- **Hardware subscriptions** (Cutegory = booking pro salon, fyzická služba) → můžeš použít web Stripe checkout, IAP NEvyžadováno
- **Digital subscriptions** (Cutegory Pro feature unlocks) → MUSÍŠ použít IAP
- **B2B / enterprise** → "Reader" apps exception (login na pre-paid web account, žádný purchase in-app)

**Doporučení pro Cutegory iOS:** Pokud iOS app je primárně tenant management (manager workflow, kalendář, booking), žádný IAP. Subscription handling zůstane na webu (Stripe), iOS čte subscription state z Supabase.

Pokud později přidá consumer-facing features s premium tier → RevenueCat (cross-platform, integruje s Stripe webhooks).

### 4.6 Push notifications strategie

**Doporučení:** Supabase Realtime + APNs direct, **NE OneSignal**.

Důvody:
- Petr už má CF Worker backend → push service na Workers s `@cf/apns-jwt` je 1-day skill
- OneSignal přidává 3rd party dependency + GDPR DPA dilemu (Petr's klienti CZ)
- Supabase pg_net + edge function může poslat APNs/FCM přímo (no middleware)

Skill chain: `ios-push-apns` → reference `references/apns-via-cf-worker.md` (CF Worker odesílá APNs s .p8 key).

Pro Android (P2): stejný pattern přes FCM HTTP v1 API z CF Workeru.

---

## 5. Recommended Build Order

### Fáze 0 — Před prvním commitem Cutegory iOS (~1 týden AI work)

**Build 6 P0 skills paralelně (skill-and-agent-master CREATE mode):**

1. `ios-master` — routing entry
2. `swiftui-patterns` — kód patterns
3. `xcode-toolchain` — build/sign basics
4. `apple-developer-program` — Apple account setup (Petr potřebuje udělat enrollment, pokud nemá — viz §7)
5. `app-store-submit` — workflow ASC
6. `fastlane-mobile` — automation glue

**Build 1 P0 agent:**
- `mobile-master` — top-level router

**Pre-requisites Petr musí udělat lidskou rukou:**
- Apple Developer Program enrollment ($99/rok, organizační je preferred pro klienty)
- App Store Connect access setup
- Bundle ID rezervace (e.g. `cz.cutegory.app`)
- Cert + provisioning přes `fastlane match` (private git repo `cutegory-certs`)

### Fáze 1 — Během prvního týdne Cutegory iOS (build as-needed)

Pořadí podle dependency:
1. `swift-openapi-codegen` (jakmile máš první API endpoint)
2. `supabase-swift` (auth flow)
3. `sign-in-with-apple` (login UI)
4. `sentry-mobile` extension (jakmile máš první crash)
5. `mobile-design-handoff` (jakmile Figma má první mobile screen)
6. `ios-testing` (jakmile máš první feature shipnutá do TestFlight)
7. `maestro-mobile-e2e` (jakmile máš 3+ screens pro full flow test)
8. `ios-push-apns` (až bude první notifikace use case)

**Build 1 P1 agent:**
- `ios-architect` (před prvním major architektonickým rozhodnutím — modul split, state management volba)

### Fáze 2 — Po Cutegory iOS shipnuté, prep pro 2. projekt

Build když přijde trigger:
- Android: `android-master` + `compose-patterns` + `gradle-toolchain` + `play-store-submit` + `android-push-fcm`
- Cross-platform: `react-native-expo` (když přijde klient chtějící shared codebase)
- Capacitor: `capacitor-wrap` (když Cutegory backoffice klient chce mobile wrapper)
- IAP: `iap-storekit2` + `iap-revenuecat` (když přijde subscription mobile feature)
- Deep linking: `deep-linking-universal-links` (když přijde magic link mobile flow)

### Fáze 3 — Refinement (continuous)

Po každém shipnutém mobile projektu spustit `skill-and-agent-master AUDIT mode` na mobile skills — captured learnings → reference updates.

---

## 6. Specifická doporučení pro Cutegory iOS

### 6.1 Stack finální doporučení

**Native Swift / SwiftUI, iOS 17+ minimum.**

Důvody:
- Cutegory = beauty/lifestyle premium → native UX je marketing differentiator
- iOS 17 minimum dovolí `@Observable` macro (čistší state mgmt než ObservableObject)
- SwiftUI 5+ má NavigationStack stable, sufficient pro většinu flows
- Backend (Supabase + CF Workers) je platform-agnostic → 0 backend overhead
- Petr má Mac + Xcode dostupný (HQ2 Mac mini cluster)

**NE Capacitor wrap.** Důvod: Cutegory backoffice je manager admin UI, ne consumer app. Pro **manager mobile app** (zkrácená verze backoffice pro on-the-go) by Capacitor mohl dávat smysl jako Fáze 2 experiment, ale pro consumer/staff app jdi native.

### 6.2 OpenAPI codegen workflow

```
cutegory-docs/openapi.yaml (single source of truth)
     ↓
swift-openapi-generator (SPM plugin)
     ↓
cutegory-ios/Networking/Generated/ (typed Swift API client)
```

Setup v `Package.swift`:
```swift
.plugin(name: "swift-openapi-generator", package: "swift-openapi-generator")
```
+ `openapi-generator-config.yaml` v iOS root.

Build trigger: každý `bunx pnpm openapi:bundle` v backend regeneruje spec → iOS build picknne změny via SPM plugin při `xcodebuild`.

### 6.3 Auth strategie

**Magic Link via Universal Links + Sign in with Apple jako primary.**

Flow:
1. User na iOS clickne "Sign in" → Sign in with Apple sheet (native)
2. Apple identityToken → POST na Cutegory CF Worker `/auth/apple` → Worker exchange za Supabase session (using `supabase.auth.signInWithIdToken({ provider: 'apple', token })`)
3. Worker vrátí refresh token + access token → iOS uloží do Keychain (`KeychainSwift` nebo `Valet`)
4. Subsequent API calls injectují Bearer token via swift-openapi middleware

Session sharing s webovým Hub:
- Univerzální session NEbude — iOS má vlastní Keychain session
- Cross-device sync = re-login na druhém device přes Apple ID (instant, no friction)

Magic link backup pro email-only users:
- User zadá email → Worker odešle magic link na email
- Link cílí `https://app.cutegory.com/auth/callback?token=...`
- AASA na `app.cutegory.com` route iOS app intercept → app otevře, předá token Supabase → session restore

### 6.4 Push notifications strategie

**APNs direct via CF Worker.** Žádný OneSignal.

Setup:
- APNs Auth Key (.p8) generovaná v Apple Developer portal
- Stored v CF Worker secrets (`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`)
- Worker `/api/notify` endpoint: signed JWT (ES256) → POST `https://api.push.apple.com/3/device/{deviceToken}`
- Supabase trigger (booking confirmed / staff message) → pg_net → Worker `/api/notify`

iOS side: standard `UNUserNotificationCenter` request authorization, device token z `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` → POST na `/api/devices/register` (Worker stores v Supabase `device_tokens` table s RLS per user).

### 6.5 CI/CD volba

**GitHub Actions s self-hosted macOS runner na HQ2 Mac mini.** NE Xcode Cloud (limit 25h/měsíc free → překročíš s 1 projektem), NE Codemagic (paid).

Setup:
- Self-hosted runner registered na `cutegory/cutegory-ios` repo
- HQ2 Mac mini má Xcode 16+ nainstalovaný
- Fastlane lanes spouštěné z `.github/workflows/ios-ci.yml`
- Match přes private repo `cutegory-certs`
- Artifacts upload to TestFlight via `fastlane pilot`

Fallback pro burst capacity: GitHub-hosted `macos-14` runners ($0.16/min — používat jen pro release builds, ne každý PR).

### 6.6 TestFlight workflow

- **Internal testers:** Petr + Jakub (TestFlight internal, no review, instant deploy, max 100 testers, vyžaduje App Store Connect user role)
- **External testers (až přijde klient):** beta link, vyžaduje "Beta App Review" první build, pak rychlé následné

Lane v Fastfile:
```ruby
lane :beta do
  match(type: "appstore")
  gym(scheme: "Cutegory", export_method: "app-store")
  pilot(skip_waiting_for_build_processing: true, changelog: ENV["CHANGELOG"])
  slack(message: "✅ Cutegory iOS build #{lane_context[:VERSION_NUMBER]} (#{lane_context[:BUILD_NUMBER]}) uploaded to TestFlight")
end
```

### 6.7 Bundle ID návrh

**Doporučení: jedna app `cz.cutegory.app`** se internal switch (manager vs customer view) podle role v Supabase session.

Důvody PRO jednu app:
- Jednodušší pro klienty (1× App Store listing)
- Jednodušší pro Petr (1× cert, 1× provisioning, 1× metadata)
- Role-based UI je SwiftUI pattern — `if role == .manager { ManagerView() } else { CustomerView() }`

Důvody PROTI (kdy split):
- Pokud Cutegory chce customer app v App Store featured (≠ B2B manager) → split na 2 apps
- Pokud manager features porušují customer privacy guidelines → split

**Default: jedna app.** Pokud klient později požádá split, rebrand customer view do nového bundle ID `cz.cutegory.customer`.

### 6.8 App Store metadata automation

Fastlane `deliver` workflow:
- Screenshots: vygenerované z XCUITest snapshot suite (`fastlane snapshot` → ~10 device combinations)
- Metadata: stored v `fastlane/metadata/cs-CZ/` (CZ-first), `en-US/` (secondary)
- Privacy nutrition labels: spravované manuálně v ASC první iteraci (deliver má limited podporu) → P2 automation
- Submission: `fastlane deliver --submit_for_review --automatic_release true`

---

## 7. Open Questions pro Petr

| # | Otázka | Proč to blokuje skill design |
|---|---|---|
| 1 | **Máš Apple Developer Program enrollment? Personal nebo organizační (Grow Lead s.r.o.)?** | Organizační vyžaduje DUNS number (5-10 dní lead time). Pokud personal, app store listing bude "Petr Rohan" ne "Grow Lead". Cutegory klient může chtít rebrand → vlastní účet + Transfer app. |
| 2 | **Cutegory iOS scope MVP:** read-only viewer (kalendář, booking list)? Full klient app (booking flow, payment)? Staff app (manager workflow)? | Scope určí jestli potřebujeme StoreKit (consumer payment), camera (photo upload), maps (location), background tasks (sync). P0 skill set se nemění, ale P1 priority se shuffle. |
| 3 | **Apple Developer Program account: kdo platí $99/rok?** Petr nebo přefakturováno na Cutegory? | Pokud client-owned účet, Petr potřebuje "App Manager" roli, ne owner. Mění Fastlane Match repo strategy. |
| 4 | **Sign in with Apple jediný auth, nebo SIWA + Email (Magic Link) + Google?** | SIWA jediný = jednodušší skill. Multi-provider = `auth-master` mobile reference musí pokrýt 3 flows. |
| 5 | **IAP relevantní pro Cutegory?** Webovka má Stripe subscriptions — replication na iOS? | Pokud ANO → P1 promote `iap-storekit2` + `iap-revenuecat`. Pokud NE (Cutegory = service business, fyzická služba) → IAP úplně skip, jen Stripe web checkout via in-app Safari. |
| 6 | **Push notifications partner: APNs direct (CF Worker), OneSignal, Firebase?** | Toto řešení doporučuji APNs direct (§6.4). Pokud Petr má strong preferenci na OneSignal (např. kvůli analytics dashboard), `ios-push-apns` skill změní scope na `onesignal-mobile`. |
| 7 | **Universal Links domain — `app.cutegory.com` nebo `cutegory.com`?** | Mění hosting AASA file (CF Worker route). Doporučuji `cutegory.com/.well-known/apple-app-site-association` (root domain, ne subdomain — Apple recommends). |
| 8 | **Existing Apple/Google API approvals u klientů (Cutegory, EventHero, atd)?** Apple App Tracking Transparency, ATT prompt? GDPR consent? | Pokud Cutegory shipuje s analytics (Firebase, PostHog) musí mít ATT prompt + GDPR consent. Mění `ios-master` skill scope (přidat ATT pattern). |
| 9 | **Cross-platform priority pro Cutegory:** Android v Q3/Q4 2026, nebo iOS-only navždy?** | Pokud Android v 6 měsících → buildovat `mobile-design-handoff` univerzálně (handoff pokrývá iOS + Android tokens). Pokud iOS-only → handoff jen Swift. |
| 10 | **Fastlane Match credentials repo strategy:** `cutegory-certs` privát repo v `grow-lead-agency` org, nebo `cz-cutegory` klientský org? | Mění access pattern + ownership pokud Petr opustí klienta. Doporučuji Petr-owned `grow-lead-agency/cutegory-certs` se delegated read access pro klienta v případě handoff. |

---

## 8. Risk & ROI Analysis

### 8.1 Top 5 Risks (solo dev + AI agents mobile)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Apple Developer enrollment delay** (DUNS 5-10 dní pro organizační účet) | High (pokud nemá) | Blokuje TestFlight, blokuje vše | Start enrollment **TEĎ**, parallelně se skill building |
| **Code signing hell** (cert expiry, provisioning mismatch, "no matching certificate" errors) | High | Block deploy on demo day | `fastlane match` + cert renewal calendar reminder (rok dopředu) |
| **App Store review rejection** (HIG violations, privacy nutrition labels missing, ATT prompt missing) | Medium | 1-3 dny delay + rework | `app-store-submit` skill pre-submission checklist + 1× test submission v dev tracku 2 týdny před launch |
| **Xcode upgrade breaking changes** (každý September Apple ships breaking) | Medium (yearly) | 1-3 dny rework | Pinout Xcode version v `.xcode-version` + Fastlane lock file + skill `xcode-toolchain` má reference `upgrade-playbook.md` |
| **Cross-language context loss** (Claude switching mezi Swift/TS context — paměť na patterns) | Medium (continuous) | Slowdown ne block | Multi-LLM dispatch (Gemini/Codex pro Swift specifically), Mem0 capture Swift-specific gotchas, ios-master skill jako primer každé session |

### 8.2 ROI Analysis

**Investice před prvním projektem:**
- P0 skills (6 skills × 1 den AI work) = ~6 dní AI execution
- P0 agent (mobile-master) = 1 den
- Petr's human work: Apple Dev enrollment + bundle ID + cert setup = 2-4 hodiny

**Návratnost při 1 mobile projektu (Cutegory iOS):**
- Time saved per task: 30-50 % (skills replace LLM exploration)
- Estimated tasks in Cutegory iOS MVP: ~40-60
- Net saving: ~15-30 AI execution hours během projektu

**Návratnost při 3 mobile projektech (2026 horizon):**
- P0 + P1 skills (14 skills total) split investment přes 3 projekty = 4.7 dní investment per project amortized
- Time saved per project escalates: 1. projekt 30 %, 2. projekt 45 %, 3. projekt 60 %
- Investment fully repaid mezi projektem 1 a 2

### 8.3 Worst-case scenarios

**"What if Cutegory iOS je jediný mobile projekt navždy?"**

Minimal skill set:
- Skip cross-platform (`react-native-expo`, `capacitor-wrap`)
- Skip Android entirely
- Skip RevenueCat (jen Stripe web checkout via in-app Safari)
- Skip Maestro (jen XCUITest)
- = 8 skills total (6 P0 + supabase-swift + sign-in-with-apple)
- Investment: ~8 dní AI work
- Even break-even pro 1 projekt s 40+ tasks

**"What if přijdou 3 mobile projekty v 2026?"**

Full investment plan:
- Build all P0 + P1 (14 skills) = ~14 dní AI work
- Add P2 selectively per project trigger
- Build android-master + compose-patterns when projekt #2 = Android
- Build react-native-expo když projekt #3 = cross-platform

ROI calc: 14 dní investice / 3 projects = 4.7 dní per project. Spared time per project: 30-60 hodin AI execution. **15-25× return.**

### 8.4 Sequence-critical learnings

1. **NIKDY nedělej code signing na last minute** — match setup je 4-hour task, ne 30-min hack
2. **TestFlight Internal je instant, External vyžaduje review** — plan demo timing accordingly (24h buffer)
3. **Privacy nutrition labels** jsou nezbytné v 2026 — submission bez nich = auto-reject
4. **ATT prompt** musí být před analytics SDK init — Sentry skill mobile reference toto musí pokrývat
5. **iOS 17 vs iOS 18 minimum** — iOS 17 minimum znamená lose ~10-15 % uživatelů, iOS 16 zachová 95 %+. Pokud Petr cílí mass market, iOS 16 minimum. Pokud premium / professional users (Cutegory salon manageři) → iOS 17 OK.

---

## Appendix A: Recommended Skill File Structure

```
agents-and-skills/skills/mobile/
├── _master/
│   └── mobile-master/
│       ├── SKILL.md
│       ├── agent.md → ../../../tools/mobile-master.md
│       └── references/
│           ├── native-vs-cross-decision.md
│           └── pmrs-mobile-pattern.md
├── ios/
│   ├── ios-master/
│   │   ├── SKILL.md
│   │   ├── agent.md
│   │   └── references/
│   │       ├── swift-language-basics.md
│   │       ├── swiftui-vs-uikit.md
│   │       ├── ios-version-targeting.md
│   │       └── spm-vs-cocoapods.md
│   ├── swiftui-patterns/
│   ├── xcode-toolchain/
│   ├── swift-openapi-codegen/
│   └── supabase-swift/
├── android/             # P2
│   ├── android-master/
│   ├── compose-patterns/
│   └── gradle-toolchain/
├── cross-platform/      # P2
│   ├── react-native-expo/
│   └── capacitor-wrap/
├── store/
│   ├── apple-developer-program/
│   ├── app-store-submit/
│   └── play-store-submit/ # P2
├── services/
│   ├── ios-push-apns/
│   ├── android-push-fcm/ # P2
│   ├── sign-in-with-apple/
│   ├── sentry-mobile/    # extension reference
│   ├── iap-storekit2/    # P2
│   ├── iap-revenuecat/   # P2
│   └── deep-linking-universal-links/ # P2
├── quality/
│   ├── ios-testing/
│   ├── maestro-mobile-e2e/
│   └── mobile-accessibility/ # P2 deferred
├── design/
│   └── mobile-design-handoff/
└── ci/
    └── fastlane-mobile/
```

## Appendix B: Decision Log (Architect's Calls)

| Decision | Choice | Rationale |
|---|---|---|
| Native vs cross-platform default | **Native** | Premium klientela, lifetime > 12 měsíců, AI generates Swift fine |
| Top-level routing | **mobile-master agent** (separate from dev-pipeline) | Mobile build/deploy fork je významný, web pipeline by se zaplevelila |
| Skill granularity | **24 fokusovaných skills** | On-demand load, easier updates, reuse across iOS/Android/RN |
| Cross-platform tool (až bude) | **Expo + EAS** (NE Flutter, NE bare RN) | TS expertise reuse, EAS managed builds bez Xcode bolesti |
| Web→mobile wrapper | **Capacitor** (NE Cordova, NE Ionic separately) | Modern, maintained, plugin ecosystem |
| Push notifications | **APNs direct via CF Worker** | Petr's existing stack, no 3rd party DPA |
| IAP | **StoreKit 2 + RevenueCat wrapper** když přijde | StoreKit 2 syntax pure, RevenueCat pro analytics + cross-platform |
| E2E mobile testing | **Maestro** (NE Detox, NE EarlGrey) | YAML simplicity, cross-platform, cloud option |
| CI/CD | **GitHub Actions self-hosted macOS** | HQ2 Mac mini already paid for, no Codemagic $$ |
| Cert management | **Fastlane Match + private git repo** | Industry standard, auto-renewal capable |
| Code generation | **swift-openapi-generator** (Apple official) | Maintained by Apple, SPM-native, type-safe |
| Architecture pattern | **TBD per project — ios-architect rozhodne** | TCA pro complex, vanilla SwiftUI+Observable pro Cutegory MVP |
| Bundle strategy Cutegory | **Single bundle ID, role-based UI** | 1× cert/provisioning/listing, defer split until product proven |

---

## Appendix C: Skill Trigger Vocabulary (CZ + EN)

Pro každý skill SKILL.md frontmatter `description` musí obsahovat triggery v obou jazycích. Vzorová vocabulary:

| Téma | CZ | EN |
|---|---|---|
| iOS native | nativní iOS, swift, swiftui, appka iOS, iPhone aplikace | ios, swift, swiftui, iphone app, native ios |
| Android native | android, kotlin, jetpack compose, android app | android, kotlin, compose, android app |
| App Store | app store, apple developer, testflight, ASC, podpis | app store, apple developer, testflight, code signing |
| Play Store | play store, google play, play console | play store, google play |
| Build | xcode build, podpis, provisioning | xcode build, sign, provisioning |
| Push | push notifikace, apns, fcm | push notifications, apns, fcm |
| IAP | nákupy v aplikaci, předplatné, storekit | in-app purchase, iap, subscription, storekit |
| E2E mobile | maestro, mobilní testy, xcuitest | maestro, mobile testing, xcuitest |
| Auth mobile | sign in with apple, mobilní přihlášení | sign in with apple, mobile auth |

---

> **Next steps pro Petr:**
> 1. Review §7 Open Questions a odpověz na min. #1, #2, #3 (blocking pro project kickoff)
> 2. Apple Developer enrollment (pokud chybí) — paralelně se skill building
> 3. Schválit Phase 0 skill build plan (6 skills + 1 agent, ~1 týden AI work)
> 4. Vytvořit Linear epic "Mobile Skills Foundation" s 7 child issues (1 per skill + agent)
> 5. Po schválení: spustit `skill-and-agent-master CREATE mode` pro každý P0 skill jeden po druhém

<!-- Origin: Petr Rohan + Claude (system-designer agent) | Created: 2026-05-25 | Inspiration: Apple HIG (developer.apple.com/design/human-interface-guidelines), Material Design 3 (m3.material.io), Fastlane docs (docs.fastlane.tools), Expo Universal App Guide (docs.expo.dev), Swift Package Manager docs (swift.org/package-manager), Capacitor docs (capacitorjs.com), RevenueCat best practices (revenuecat.com/docs), Maestro Mobile Testing (maestro.mobile.dev), supabase-swift README (github.com/supabase/supabase-swift), swift-openapi-generator (github.com/apple/swift-openapi-generator), Petr's existing agents-and-skills/ ekosystém + CLAUDE.md preferences. -->

---

# APPENDIX (added 2026-05-25 evening) — Three Updates from Petr

> **Status:** Sekce 9-12 jsou **dodatek** k původní architektuře (§0-§8). Při konfliktu s předchozím doporučením platí appendix.
>
> **Trigger:** Tři nové vstupy od Petra:
> 1. PMRS (Platform Meta-Repo System) je hotový a ready — Cutegory už má parent meta-repo s `bin/add-repo.sh`. Žádný PMRS-aware skill setup neni potřeba.
> 2. Petr **nezná Swift**. Native SwiftUI je technicky proveditelné s AI, ale Petr potřebuje rozumět co se děje při review, debugu, App Store rejection, signing chaos. Learning load je decisive faktor.
> 3. První milestone Cutegory iOS = **Supabase auth + data**. Ne push, ne IAP, ne deep links. Skill priorita musí reflektovat tohle.
>
> **Co se mění v §0-§8:** Primary stack doporučení (§0, §1.1, §1.2) se mění z **native SwiftUI** na **Expo (RN) + EAS**. Skill inventory §2 dostává reprioritizaci (§11 níže). Open Questions §7 většinou vyřešeny touto změnou.

---

## 9. Revised Recommendation — Expo first, native later

### 9.1 Změna primary stack doporučení

**Původní (§0, §1.1):** Native SwiftUI (iOS) + Jetpack Compose (Android, později). Rationale: AI píše Swift stejně dobře jako TS.

**Nové:** **Expo (React Native) + EAS Build/Submit jako default pro VŠECHNY klientské mobile projekty.** Native ejekce nebo native modules jen pro konkrétní use-case constraints (viz §9.3).

**Důvod změny:** Petr's profile (§1.2) byl zhodnocen nesprávně. Učící křivka Petra **samotného** je decisive faktor, ne učící křivka AI agenta. AI píše Swift well, ale Petr potřebuje:
- Číst a rozumět co Claude vygeneroval (pro code review)
- Debugovat když něco selže (signing, archive, runtime crash)
- Pochopit App Store rejection reasoning v Apple zprávách
- Komunikovat s klientem co se děje technicky

Petr zná React. Expo = React s file-based routing. Učící křivka **dnů**, ne měsíců.

### 9.2 Detailed comparison — Native SwiftUI vs Expo vs Capacitor

| Kritérium | Native SwiftUI | **Expo (RN) + EAS** | Capacitor |
|---|---|---|---|
| **Jazyk** | Swift (Petr 0%, AI píše OK) | TypeScript/React (Petr 100%) | TypeScript/React (Petr 100%) |
| **Codebases pro iOS+Android** | 2 oddělené | **1 shared** | 1 shared (z webu) |
| **Build/signing setup** | Xcode + provisioning + certificates (manual hell) | **EAS managed credentials** (automated) | EAS Build podporuje Capacitor, jinak manual Xcode |
| **OTA updates** | Ne (musí přes App Store review) | **EAS Update** (instant JS bundle push) | Capacitor Live Updates (paid) |
| **Supabase SDK** | `supabase-swift` (oficiální, slušná kvalita) | **`@supabase/supabase-js` v RN-tested** | `@supabase/supabase-js` (web SDK) |
| **AI agent corpus** | Swift/SwiftUI: středně velký, dobrá kvalita | **RN/Expo: obrovský**, mnoho příkladů | Web + Capacitor plugins: solidní |
| **Native API přístup** | 100% (cokoliv Apple expose) | 95% via Expo modules + community packages; 100% via custom native module | 70% via Capacitor plugins; potřeba native code pro vše ostatní |
| **Performance ceiling** | Nejvyšší (nativní) | Vysoký (Hermes engine + new architecture) | Střední (web view) |
| **UX feel** | 100% native | 90% native (vypadá jak native, drobné drift) | 60-70% (cítí se jak webová app) |
| **App Store risk** | Žádný | Žádný (Meta + Microsoft + Shopify build na Expo) | **Občas rejection** za "thin wrapper" pokud je to čistě webview |
| **Time to first build** | Hodiny-dny (Xcode setup) | **Minuty** (EAS managed) | Hodiny (Xcode + Android Studio setup) |
| **Bundle size (iOS)** | Nejmenší (~5-10 MB) | Střední (~25-40 MB s Hermes) | Střední (~20-30 MB) |
| **Cena tooling/měsíc** | $0 (Xcode free) | EAS free tier OK pro 1 app, $19+/mo Production pro více | $0 self-hosted, paid pro Live Updates |
| **Když to selže — kdo to opraví?** | Petr s pomocí AI (ale neumí Swift) — pain | **Petr sám** (React + JS error stack) | Petr sám (web stack) |
| **Long-term lifecycle tax** | SwiftUI breaking changes každý iOS release, deprecated API churn | RN upgrade hell historicky pravda, ALE **Expo SDK + EAS Update automatizuje 90% bolesti** | Capacitor jednodušší, ale menší ekosystem = víc DIY |

**Verdict:** Expo wins na 9 z 14 kritérií pro Petr's konkrétní situaci. Capacitor je viable pro specific niche (§9.3 case B).

### 9.3 Decision tree — Mám otázku, jaký stack pro mobile projekt X?

```
Q1: Existuje hotový web app (React/Next.js) s 80%+ feature parity?
  YES → Q2
  NO  → Q3

Q2: Klient chce app store presence rychle (< 4 týdny) a UI feel je sekundární?
  YES → CAPACITOR (wrap existing web)
  NO  → EXPO (postavit native-feeling z React komponent)

Q3: Potřebuje app one z těchto?
  - Heavy 3D / AR (ARKit, RealityKit, SceneKit)
  - Live Activities / Dynamic Island
  - Apple Watch companion s complex UI
  - HealthKit deep integration
  - On-device ML s Core ML custom modely
  - 60fps gesture animations s real-time data binding
  - Strict App Store category (banking, medical, kids)
  YES → NATIVE SwiftUI (musíš se učit Swift, je to inherent cost)
  NO  → Q4

Q4: Single platform iOS-only s premium UX a klient platí za polish?
  YES → NATIVE SwiftUI (justified investment)
  NO  → EXPO (default)
```

**Aplikace na Cutegory iOS (známý scope: booking, customer profile, loyalty, notifications):**
- Q1: NO (Cutegory backoffice je Next.js admin, ne customer-facing — feature parity ~30%)
- Q3: NO (booking flow + profile + notifs jsou všechny Expo-friendly)
- Q4: NO (cross-platform Android přijde later)
- → **EXPO**

### 9.4 Migration paths

**Expo → Native (eject scenario):**
- Kdy: Projekt narostl, potřebuje feature z Q3 která Expo modules neumožňují
- Jak: **Nepoužívat `expo prebuild` eject jako trvalou cestu.** Místo toho přidat **custom native module** k Expo projektu (`expo-modules-core` API) → nativní Swift/Kotlin kód jen pro tu feature, zbytek Expo
- Skutečný eject (full bare workflow) = nuclear option, jen pokud potřebuješ 5+ native features

**Capacitor → Expo (upgrade scenario):**
- Kdy: Capacitor app rostla z "wrap" do "real product" a UI feel začíná být problém
- Jak: Není přímá migrace, je to rewrite. Ale React komponenty se z 60% dají přenést (s NativeWind místo Tailwind, RN primitives místo HTML)
- Doporučení: Pokud víš, že Capacitor je dočasné řešení → naplánuj rewrite na Expo do 12 měsíců, nenech to roky růst

**Expo SDK upgrade (interní lifecycle):**
- Expo SDK upgrade je 1× za 6 měsíců, EAS provede `npx expo install --check` + `npx expo-doctor` workflow
- Breaking changes obvykle 1-2 dependencies update, ne celý rewrite
- HARD RULE: nikdy nezůstávej víc než 2 SDK verze za current (SDK 52 current → drop support 50)

### 9.5 Co se mění oproti §2-§5 (původní native plán)

**Vypadlé skills (původně P0/P1, teď deprioritized do P2 nebo úplně vystřižené):**

| Původní # | Skill | Status v appendixu |
|---|---|---|
| 2 (P0) | `swiftui-patterns` | **P2** — jen pokud projekt eject z Expo |
| 3 (P0) | `xcode-toolchain` | **P1 light** — minimum (xcodebuild commands pro local builds, signing setup), zbytek řeší EAS |
| 7 (P1) | `swift-openapi-codegen` | **VYPADLO** — RN použije OpenAPI Generator s TypeScript template, jednodušší |
| 8 (P1) | `supabase-swift` | **VYPADLO** — nahrazeno `expo-supabase-auth` (sekce 11) |
| 10 (P1) | `sign-in-with-apple` (Swift implementace) | **přejmenované** — bude `expo-sign-in-with-apple` (`expo-apple-authentication` package) |
| 11 (P1) | `ios-testing` (XCTest) | **VYPADLO** z P1 — RN testing s Jest + React Native Testing Library + Maestro pokrývá |
| 15-17 (P2) | `android-master`, `compose-patterns`, `gradle-toolchain` | **P2 → P3** — Expo pokrývá Android free, native Android jen pokud projekt eject |

**Skills, které zůstávají i v Expo světě (nezměněné nebo lehce přejmenované):**

| Skill | Status | Pozn. |
|---|---|---|
| `apple-developer-program` | **P0 stále** | EAS managed credentials potřebuje Apple Developer account podsebou |
| `app-store-submit` | **P0 stále** | EAS Submit nahrazuje fastlane pilot, ale ASC metadata + screenshots stále manual proces |
| `fastlane-mobile` | **P2** — místo `eas-build` skill v P0 | Fastlane stále využitelné pro Play Store nebo edge case |
| `mobile-design-handoff` | **P1** | Beze změny, Figma → RN handoff podobný |
| `sentry-mobile` | **P1** | Sentry React Native SDK + EAS source maps integration |
| `maestro-mobile-e2e` | **P1** | Maestro je cross-platform, RN-friendly |
| `apple-developer-program`, `app-store-submit`, `play-store-submit` | beze změny | Store submit logika je platform-independent |

**Net change:** **24 plánovaných skills → 18 realistických** (6 vypadlo nebo demoted). Save ~3-4 dny AI work.

---

## 10. Boilerplate / Starter Template Strategy

Petr explicitně řekl "neslo by vzit nejaky boilerplate". To je **správný instinct** — pro první mobile projekt nestavět od nuly. Tahle sekce hodnotí existující startery a doporučuje koncrétní cestu.

### 10.1 Audit existujících templates v Petr's ekosystému

Kontrola `~/Developer/DEV/templates/` (k 2026-05-25):

```
templates/
├── cf-tool-template/            (CF Worker + MCP)
├── gl-app-template/             (Next.js SaaS s Supabase)
├── gl-microsite-template/       (marketing site)
├── nextjs-supabase/             (legacy Next.js)
├── platform-meta-repo-template/ (PMRS template — meta-repo skeleton)
├── tailwind-plus/               (UI komponenty)
└── _worktrees/, _scratch/       (working dirs)
```

**Závěr:** Žádný mobile/Expo template neexistuje. **TODO #1: vytvořit `templates/expo-supabase/`** jako součást Cutegory iOS bootstrap.

### 10.2 Expo starters — landscape evaluation

| Starter | Typ | Co dostaneš | Verdict pro Petr |
|---|---|---|---|
| `create-expo-app@latest` (default template) | Official baseline | Expo SDK + Router + TS + ESLint | **Použít jako foundation**, sám o sobě moc lean (žádný auth, žádný design system) |
| `expo-router` examples (`expo/router` repo) | Official examples | Routing patterns | Knowledge reference, ne starter |
| **`expo-supabase-starter`** (community by `flemingvincent`, 2k+ stars) | Production-grade | Expo Router + Supabase auth + RN Reusables (shadcn-port) + NativeWind + TS + Magic Links + SIWA | **Top kandidát** — pokrývá 80% Petr's needs out-of-box |
| **t3-turbo** (Theo's stack) | Monorepo | Turborepo + Next.js + Expo + tRPC + Drizzle + Tailwind | Overkill pokud nesdílíš tRPC backend s webem. Cutegory backoffice je REST + Supabase, ne tRPC → **skip** |
| `expo-stripe-template` (official Expo blog example) | Niche | Stripe IAP integration | **P2** — jen pokud Cutegory iOS přidá payments |
| Bacons starters (Evan Bacon, Expo team) | Production examples | Various (Twitter clone, etc.) | Knowledge reference, **inspirace pro patterns** ne baseline |
| `expo-starter` (community paid templates, $99+) | Premium | Curated stacks | **Skip** — `expo-supabase-starter` zdarma + community-backed je dostačující |

**Decision:** Začni s **`expo-supabase-starter`** (community), fork → adapt na GrowLead conventions → uložit jako `~/Developer/DEV/templates/expo-supabase/` pro budoucí použití.

### 10.3 Capacitor starters (pro reference, ne pro Cutegory iOS)

| Starter | Použití |
|---|---|
| `@capacitor/create-app` | Vanilla Capacitor + framework choice |
| Ionic templates (capacitor-based) | Pokud klient chce Ionic UI |
| Next.js + Capacitor recipes | Pro internal staff apps (manager mobile dashboard z Cutegory backoffice) |

Capacitor template **NEpotřebujeme dělat zatím** — až přijde projekt který to opravdu potřebuje (např. Cutegory backoffice manager mobile v Q3+ 2026).

### 10.4 Native iOS starters (skip pro teď)

Vesměs outdated nebo paid. Apple's "official" Xcode templates jsou bare-bones. Pokud někdy ejectneš z Expo do native iOS, půjde se od existing Expo bare workflow ne od greenfield Xcode template.

### 10.5 Doporučená cesta — `~/Developer/DEV/templates/expo-supabase/`

**Investment:** 1 den AI work (8h equivalent). **ROI:** Použije se v Cutegory iOS + KAŽDÉM dalším mobile projektu (Petr má v pipeline minimálně 2-3 klientské mobile apps).

**Stack composition:**

| Vrstva | Volba | Důvod |
|---|---|---|
| **Expo SDK** | 52+ (latest stable k 2026-05) | SDK 52 přidal New Architecture default ON, Fabric stable |
| **Router** | Expo Router v4 (file-based) | Konsistentní s Petr's Next.js mental model |
| **Language** | TypeScript strict | Petr's default |
| **Supabase client** | `@supabase/supabase-js` v2.x + custom storage adapter | SSR adapter není potřeba na mobile |
| **Session storage** | **`expo-secure-store`** | **Petr's HARD RULE** — NIKDY AsyncStorage pro tokens (zranitelné na rooted/jailbroken devices) |
| **Styling** | NativeWind (Tailwind pro RN) | Petr's design system carry-over z webu |
| **Forms** | React Hook Form + Zod | Stejný stack jako Cutegory backoffice |
| **Icons** | `@expo/vector-icons` (built-in) + Lucide RN | Lucide pro consistency s webem |
| **State** | React Query v5 (`@tanstack/react-query`) pro server state, Zustand pro client state | Konzistentní s gl-app-template |
| **Error tracking** | `@sentry/react-native` + EAS source maps upload | Reuse existing Sentry org |
| **Build** | EAS Build (preview + production profiles) | Managed credentials |
| **OTA** | EAS Update (enabled, jen kritické bugfixes — ne full feature replacement, Apple policy) | |
| **CI** | GitHub Actions workflow: lint + tsc + `eas build --profile preview --non-interactive` na PR | |
| **Lint/format** | Biome (consistent s gl-app-template) | NE ESLint + Prettier — Biome je Petr's default |
| **Git hooks** | Lefthook (consistent) | |
| **Testing** | Vitest (unit) + RN Testing Library (component) + Maestro (E2E) | |

**Files included v templatu:**

```
expo-supabase/
├── README.md                          # Setup guide pro nový projekt
├── init.sh                            # bash init script — accept project name → setup
├── app/                               # Expo Router file-based routes
│   ├── _layout.tsx                    # Root layout + Supabase provider + Sentry
│   ├── (auth)/                        # Auth-protected group
│   │   ├── _layout.tsx                # Redirect logic
│   │   └── index.tsx                  # Home screen (placeholder)
│   ├── (public)/                      # Public routes
│   │   ├── sign-in.tsx                # Magic link + SIWA
│   │   └── _layout.tsx
│   └── +not-found.tsx
├── components/
│   ├── ui/                            # NativeWind primitives (button, input, card)
│   └── supabase-provider.tsx          # Context + session listener
├── lib/
│   ├── supabase.ts                    # Client setup s expo-secure-store adapter
│   ├── sentry.ts                      # Sentry init
│   └── env.ts                         # zod-validated env
├── types/
│   └── supabase.ts                    # Generated types (placeholder + script v package.json)
├── .env.example                       # SUPABASE_URL, SUPABASE_ANON_KEY, SENTRY_DSN
├── app.json                           # Expo config + EAS Build profiles
├── eas.json                           # EAS Build/Submit profiles (preview + production)
├── babel.config.js                    # NativeWind + Expo Router
├── metro.config.js                    # NativeWind + Sentry
├── tailwind.config.js                 # Tokens (synced s Cutegory design tokens)
├── biome.json                         # Lint/format
├── lefthook.yml                       # Git hooks
├── package.json                       # Bun-compatible
├── tsconfig.json                      # strict
├── .github/workflows/
│   └── eas-preview.yml                # CI: lint + tsc + EAS preview build na PR
├── AGENTS.md                          # AI context (mobile-specific)
├── CLAUDE.md                          # → pointer na AGENTS.md
└── .gitignore                         # Xcode + Android + Expo + node patterns
```

**Init flow:**

```bash
cd ~/Developer/DEV/clients/Cutegory/cutegory-ios
~/Developer/DEV/templates/expo-supabase/init.sh
# Script se zeptá:
#  - Project name (default: cutegory-ios)
#  - Bundle ID (default: cz.growlead.cutegory)
#  - Supabase project ref (default: prompt)
#  - Sentry DSN (default: skip, add later)
# Script provede:
#  - Copy template files
#  - Replace placeholders v app.json, eas.json, package.json
#  - bun install
#  - git init + first commit "chore: init from expo-supabase template"
```

---

## 11. Reduced P0 — Supabase-first

Petr's first milestone (Input 3) = **napojení na Supabase** (auth + data). Repriortizace P0 odpovídá tomu.

### 11.1 New P0 — Build pro Cutegory iOS milestone 1 (7 skills)

| # | Skill | Path | Účel | Triggery | Závisí na |
|---|---|---|---|---|---|
| 1 | **expo-master** | `mobile/cross-platform/expo-master/` | Top-level orchestrator pro Expo/RN dev. Routing do sub-skills. Decision tree native vs Expo vs Capacitor (z §9). Nahrazuje původně plánovaný `mobile-master`. | "mobile", "expo", "react native", "RN", "expo app", "appka", "mobile app", "iOS app", "Android app" | dev-skill, stack-rules |
| 2 | **expo-supabase-starter** | `mobile/cross-platform/expo-supabase-starter/` | Bootstrap Expo + Supabase project z `~/Developer/DEV/templates/expo-supabase/`. Init script, environment setup, first run. Knowledge: template structure, kdy fork vs use as-is. | "expo supabase starter", "boilerplate", "init mobile project", "scaffold expo", "nový mobile projekt" | expo-master, supabase |
| 3 | **expo-supabase-auth** | `mobile/cross-platform/expo-supabase-auth/` | Auth flow specifický pro Expo + Supabase: Magic Links (deep link handling), Sign in with Apple (`expo-apple-authentication`), session persistence via `expo-secure-store`, onAuthStateChange, refresh tokens, sign-out cleanup. | "expo auth", "supabase auth mobile", "sign in with apple expo", "magic link rn", "secure store" | expo-master, auth-master, expo-supabase-starter |
| 4 | **expo-supabase-data** | `mobile/cross-platform/expo-supabase-data/` | PostgREST queries z RN, optimistic updates s React Query, RLS patterns specifické pro mobile (JWT v secure storage), error handling (offline-aware), TypeScript types generation z Supabase. | "supabase queries rn", "react query supabase", "RLS mobile", "expo data fetch" | expo-supabase-auth, postgres-knowledge |
| 5 | **expo-router** | `mobile/cross-platform/expo-router/` | Expo Router v4 file-based routing: layouts, groups `(auth)`/`(public)`, dynamic routes `[id]`, modal stacks, tab navigation, deep linking via Universal Links + App Links, redirect patterns. | "expo router", "file-based routing rn", "navigation expo", "deep linking expo" | expo-master |
| 6 | **expo-ui-patterns** | `mobile/cross-platform/expo-ui-patterns/` | Common mobile UI patterns s NativeWind: lists (FlatList vs FlashList), forms s React Hook Form, sheets/modals (`@gorhom/bottom-sheet`), pull-to-refresh, infinite scroll, loading states, empty states, safe areas, keyboard handling. | "react native UI", "nativewind", "bottom sheet", "rn forms", "mobile UX patterns" | expo-master, ui-primitives |
| 7 | **eas-build** | `mobile/ci/eas-build/` | EAS Build & Submit setup: `eas.json` profiles (development/preview/production), managed credentials, build matrix, env variables, `eas submit --platform ios`, TestFlight workflow, App Store Connect API integration, EAS Update (OTA) policy. | "eas build", "eas submit", "expo build", "testflight expo", "eas update", "OTA expo" | expo-master, apple-developer-program |

**Rationale pro nový P0:**
- 1 = orchestrator (entry point)
- 2 = bootstrap (jak začít)
- 3 = auth (milestone #1 explicit)
- 4 = data (milestone #1 explicit pokračování)
- 5 = navigation (každá app potřebuje)
- 6 = UI patterns (každá app potřebuje)
- 7 = build & ship (TestFlight pro Jakub/Petr feedback loop)

Bez kteréhokoliv ze 7 zůstaneš zaseknutý. S nimi máš end-to-end pipeline Cutegory iOS milestone 1.

**Skills, které zůstávají P0 z původního inventory (§2.1):**

| Původní # | Skill | Status |
|---|---|---|
| 4 | `apple-developer-program` | **P0 stále** — EAS managed credentials nepotřebuje, ale Apple Developer account je nutný |
| 5 | `app-store-submit` | **P0 stále** — EAS Submit automatizuje upload, ale screenshots/metadata/privacy nutrition labels jsou manual |

**Net P0:** 7 nových + 2 zachované = **9 skills total v P0**. Build effort: ~7 dní AI work (1 skill/den s research + writing + sources + reference).

### 11.2 Demoted to P1 — after milestone 1 shipped (5 skills)

| # | Skill | Path | Důvod demote |
|---|---|---|---|
| 8 | **expo-supabase-realtime** | `mobile/cross-platform/expo-supabase-realtime/` | Live subscriptions, presence channels. Milestone 1 nemá realtime requirement (Cutegory booking je polling-friendly) |
| 9 | **expo-supabase-storage** | `mobile/cross-platform/expo-supabase-storage/` | Image upload (profile avatars, attachments), signed URLs, `expo-image-picker` integration |
| 10 | **expo-push-notifications** | `mobile/services/expo-push-notifications/` | `expo-notifications` + Supabase + APNs/FCM. Milestone 2 feature |
| 11 | **expo-deep-linking** | `mobile/services/expo-deep-linking/` | Universal Links setup (AASA file hosted on CF Worker), app links Android, deferred deep links |
| 12 | **expo-sentry** | `mobile/services/expo-sentry/` | Sentry RN setup, EAS source maps upload, performance tracing, breadcrumbs. Petr's existing `sentry-mastery` extension |

### 11.3 Demoted to P2 — kdy potřebuješ vystoupit z Expo (5 skills)

| # | Skill | Path | Trigger |
|---|---|---|---|
| 13 | **expo-modules-custom-native** | `mobile/cross-platform/expo-modules-custom-native/` | Custom Swift/Kotlin native module v Expo projektu (bez full eject) |
| 14 | **swiftui-patterns** (P0→P2) | `mobile/ios/swiftui-patterns/` | Až pokud projekt eject z Expo |
| 15 | **xcode-toolchain-deep** | `mobile/ios/xcode-toolchain-deep/` | Hlubší Xcode workflow než EAS automatizuje (debug s LLDB, Instruments profiling) |
| 16 | **storekit2-iap** | `mobile/services/storekit2-iap/` | Pokud Cutegory iOS přidá in-app purchases (paid tier, gift cards mobile) |
| 17 | **revenuecat-cross-platform** | `mobile/services/revenuecat-cross-platform/` | RevenueCat wrapper pokud chceme unified subscription state web + mobile |

### 11.4 Demoted to P3 — pro 2. mobile projekt nebo Android-first

Všechno native Android (Kotlin, Compose, Gradle) — Expo pokrývá Android free, dedicated Android skills jen pokud klient explicit Android-first projekt s native UI ambicemi.

| Skill | Důvod čekat |
|---|---|
| `android-master` | Expo + Android = zero extra setup |
| `compose-patterns` | Jen pokud Android eject |
| `gradle-toolchain` | EAS Build řeší |
| `android-push-fcm` | `expo-notifications` to abstraktuje |
| `play-store-submit` | EAS Submit + Play Console workflow řeší 80% — dedicated skill jen pokud potřeba advanced (staged rollout, internal testing) |

### 11.5 Vystřižené úplně (oproti původnímu §2)

| Skill | Důvod cut |
|---|---|
| `swift-openapi-codegen` | RN použije TS generator |
| `supabase-swift` | nahrazeno `expo-supabase-auth` + `expo-supabase-data` |
| `sign-in-with-apple` (Swift) | součást `expo-supabase-auth` |
| `ios-testing` (XCTest) | RN testing stack pokrývá |
| `kotlin-multiplatform`, `flutter`, `detox`, `arkit`, `arcore`, `wearos`, `carplay`, `watchos`, `android-tv`, `android-auto` | Bez změny — stále skip |

### 11.6 Final skill count

| Tier | Původní (§0) | Po appendixu | Δ |
|---|---|---|---|
| P0 | 6 | **9** | +3 (Expo-centric stack vyžaduje víc fokusovaných skills) |
| P1 | 8 | **5** | -3 (méně native iOS specific) |
| P2 | 10 | **5** | -5 (Android+native přesunut do P3 nebo cut) |
| P3 | — | **5** | +5 (Android dedicated jen on-demand) |
| Skill upgrades existujících | 6 | **6** | beze změny |
| **Total nových skills** | **24** | **24** | **stejně 24, ale jiná kompozice + 9 v P0 místo 6** |
| **Total agents** | 4 | **2** (expo-master + ios-eject-architect; android-architect → P3) | -2 |

**Build investment shift:** Místo 24 skills naráz, **9 P0 skills front-loaded** + ~7 dní AI work, zbytek as-needed.

---

## 12. PMRS Integration & Cutegory iOS Bootstrap Sequence

Konkrétní commands a workflow pro day-1 setup až po first commit, využívající existující PMRS infrastruktura.

### 12.1 Step 0 — Předpoklady (1× per developer setup)

| Předpoklad | Kdo řeší | Lead time | Pozn. |
|---|---|---|---|
| **Apple Developer enrollment** | Petr | ~24h (individual) / 5-10 dní (organization s DUNS) | $99/year. Pro klientské projekty pravděpodobně **Apple Developer Program Enterprise** nebo per-klient account (transfer apps later) |
| **Expo account** | Petr | minuty | Free. Sign up na expo.dev |
| **EAS CLI** | Petr | minuty | `bun add -g eas-cli` → `eas login` |
| **Xcode** | Petr | ~1h (8GB download) | Pro simulator + lokální debug. Build jde přes EAS, ale potřebujeme Xcode pro local iteration. App Store install free |
| **CocoaPods** (legacy fallback) | Petr | minuty | `brew install cocoapods`. Expo SDK 52+ s New Architecture umí bez Pods, ale občas se hodí |
| **Apple Developer Bundle ID** | Petr | minuty | Identifier v ASC: `cz.growlead.cutegory` (potvrď s klientem) |

**Blocking:** Apple Developer enrollment je single largest lead time. **Start NOW** paralelně se skill build.

### 12.2 Step 1 — PMRS přidá iOS sub-repo

PMRS (`~/Developer/DEV/clients/Cutegory/`) má hotový `bin/add-repo.sh`. Workflow:

```bash
cd ~/Developer/DEV/clients/Cutegory
bash bin/add-repo.sh cutegory-ios --role mobile --stack expo
```

**Co skript musí udělat (a co může chybět — TODO #2):**

| Akce | Status v současném add-repo.sh | TODO |
|---|---|---|
| Create GitHub repo `grow-lead-agency/cutegory-ios` | ✅ má | — |
| Clone do `~/Developer/DEV/clients/Cutegory/cutegory-ios` | ✅ má | — |
| Register v `platform.yaml` | ✅ má | Pole `role: mobile` zatím neexistuje → přidat |
| Vytvořit `AGENTS.md` pointer | ✅ má | Template je generic — potřeba **iOS variant** |
| Vytvořit `CLAUDE.md` symlink | ✅ má | — |
| `.gitignore` patterns | ✅ má — node patterns | **Přidat**: Xcode (`*.xcuserdata`, `DerivedData/`, `*.mobileprovision`), Expo (`.expo/`, `dist/`, `web-build/`), iOS (`Pods/`, `ios/build/`) |
| CI workflow template | ✅ má — Lint + Test | **Nahradit**: `.github/workflows/eas-preview.yml` (lint + tsc + EAS preview build) |
| Commit + push | ✅ má | — |

**TODO #2 actionable:** Extend `bin/add-repo.sh` s `--stack expo` flag → switch templates dle stacku. Skill `expo-supabase-starter` toto pokryje v references.

**TODO #3 actionable:** Update PMRS `bin/audit.sh` — per-role scoring weights. Současný audit počítá s Bun/TS conventions. iOS sub-repo dostane nižší skóre bezdůvodně (např. `package.json` na root je odlišný, `tsconfig.json` má jiné target). Roles: `mobile`, `web`, `ops`, `docs`.

### 12.3 Step 2 — Bootstrap Expo project z templatu

```bash
cd ~/Developer/DEV/clients/Cutegory/cutegory-ios
~/Developer/DEV/templates/expo-supabase/init.sh
# Inputs (skript ptá):
#   Project name: cutegory-ios
#   Bundle ID: cz.growlead.cutegory
#   Supabase project ref: <Cutegory Supabase ref>
#   Sentry DSN: <skip — add later>
```

Po dokončení:
- `bun install` proběhne automaticky
- `git status` ukáže pouze `[untracked] expo template files` (PMRS init commit už byl)
- Manuální commit: `git add . && git commit -m "feat: bootstrap from expo-supabase template"`

### 12.4 Step 3 — Connect Supabase (existing Cutegory project)

**DŮLEŽITÉ:** Neporcházet nový Supabase project. Cutegory iOS app sdílí existing Cutegory backoffice Supabase project (stejná data, stejné RLS policies, jen jiný klient).

Setup:
1. Z Supabase dashboard: Project Settings → API → `URL` + `anon public` key
2. `~/Developer/DEV/clients/Cutegory/cutegory-ios/.env.local` (gitignored):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. Verify v `lib/env.ts` (zod validation) — start s template hodnotami
4. Test connection:
   ```bash
   bunx expo start
   # Press 'i' → iOS simulator
   # App se otevře, sign-in screen → zkus magic link na svůj email
   ```

**Sign-off:** Pokud magic link přišel na email a klik na něj otevřel app → step 3 done.

### 12.5 Step 4 — First auth flow (Sign in with Apple + Magic Link)

Skill `expo-supabase-auth` provede detailněji. Quick reference:

```bash
bunx expo install expo-apple-authentication expo-secure-store expo-linking expo-web-browser
```

App.json (relevant section):
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "cz.growlead.cutegory",
      "usesAppleSignIn": true
    },
    "scheme": "cutegory",
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-apple-authentication"
    ]
  }
}
```

Auth flow:
- **SIWA**: `signInWithIdToken({ provider: 'apple', token: appleCredential.identityToken, nonce })`
- **Magic link**: `signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL('/(auth)') } })`
- Session persistence: custom storage adapter pro Supabase client (template má hotové)

Apple ASC requirements pro SIWA:
- App ID v Apple Developer Portal → enable "Sign in with Apple" capability
- Reset bundle ID provisioning (EAS managed credentials to udělá automaticky)

### 12.6 Step 5 — First protected screen

Cutegory `profiles` table má RLS policy `user_id = auth.uid()`. Z RN:

```typescript
// app/(auth)/index.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Text>Loading...</Text>;
  return <Text>Hello {data?.full_name}</Text>;
}
```

Sign-off: po sign-in jsi v `(auth)` group, vidíš svoje jméno z `profiles` table. RLS funguje (zkus odhlásit a přihlásit jako jiný user → uvidíš jiné jméno).

### 12.7 Step 6 — First EAS Build (preview profile pro TestFlight)

```bash
cd ~/Developer/DEV/clients/Cutegory/cutegory-ios
eas build --profile preview --platform ios
# První build: EAS se zeptá:
#   "Generate a new Apple Distribution Certificate?" → Yes
#   "Generate a new Apple Provisioning Profile?" → Yes
# (EAS managed credentials = žádný Xcode signing hell)
```

**Lead time:** ~15 minut první build (instalace deps + native build na EAS infra). Subsequent builds ~5-8 min (cached).

Output: `.ipa` file URL + QR code. Můžeš ho stáhnout a otestovat lokálně přes `eas device:create` + drag-drop do simulator, ale typicky šup do TestFlight (step 7).

### 12.8 Step 7 — First TestFlight upload

```bash
eas submit --platform ios --latest
# EAS se zeptá:
#   "Apple ID" → petr@growlead.cz
#   "App-specific password" → vytvořit v appleid.apple.com
#   "ASC App ID" → najít v App Store Connect
# (Tyto credentials cachne EAS na project — next submit nepotřebuje znova)
```

Po submit:
- Apple zpracuje upload ~5-15 min (export compliance check + bitcode strip)
- App Store Connect → TestFlight → tvůj build se objeví v "Builds" tab
- Internal Testers (Petr + Jakub jako Apple ID v ASC users): okamžitě dostupné
- External Testers: vyžaduje Apple review (24-48h, beta review je rychlejší než App Store review)

**Sign-off:** Jakub si stáhne TestFlight app, otevře invite link, nainstaluje cutegory-ios, otevře, přihlásí se přes SIWA → vidí svůj profile. **End of milestone 1.**

### 12.9 Realistic timeline pro Petra (AI estimates, ne human)

> **Pozn.:** Tyto odhady jsou z pohledu AI/LLM execution + Petr's review cycles, ne lidská "kódová" práce. Petr review + testing dominuje (AI execution je sekvencí 15-min sessionů).

| Den | Kroky | AI execution | Petr review/test |
|---|---|---|---|
| **Den 1** | Step 0 (předpoklady) + Step 1 (PMRS add-repo) | ~30 min (skript run) | ~2-3h (Apple Developer setup, account creation, browser klikání) |
| **Den 1-2** | Step 2 (template bootstrap) + Step 3 (Supabase connect) | ~1h (template create + adapt) | ~1-2h (verify, debug env issues) |
| **Den 2-3** | Step 4 (auth flow) — build expo-supabase-auth skill paralelně | ~3-4h (skill writing + implementation + test) | ~2h (test SIWA + magic link na real device) |
| **Den 4** | Step 5 (first protected screen) | ~1h | ~1h (verify RLS, test multiple users) |
| **Den 5** | Step 6 (first EAS build) | ~15 min (`eas build` čeká na cloud) | ~1h (debug pokud první build fail — typicky bundle ID mismatch nebo missing capability) |
| **Den 5-6** | Step 7 (TestFlight submit + invite) | ~15 min | ~2-4h (Apple zpracování + Jakub testing + feedback) |
| **Týden 2** | Iteration na feature setu — booking list, profile edit, settings | ~4h/feature AI | ~2h/feature review |
| **Týden 3** | Polish + first real klientský review (Cutegory team) | ~6-8h AI | ~4h review cycle |
| **Týden 4** | Production submit do App Store (review 24-48h Apple side) | ~30 min (submit) | ~1-2h (privacy nutrition, screenshots, metadata) |

**End-to-end (milestone 1 → klient v ruce na real device):** ~5-6 dní AI work + Petr review intersperse, calendar time ~1-2 týdny pokud bez blockerů.

**Calendar time pokud blockery (realistic):** ~3 týdny (Apple Developer enrollment může backlog, první SIWA flow má 3-5 gotchas, EAS první credentials sync občas fail).

### 12.10 PMRS audit upgrade — actionable Linear issues

Bootstrap odhalí 3 PMRS gaps. Vytvořit Linear issues:

1. **PMRS-101 (skill-update): add `--stack expo` flag do `bin/add-repo.sh`**
   - Add: role detection (`mobile`/`web`/`ops`/`docs`), template switching, .gitignore patterns per stack, CI workflow per stack
   - Acceptance: `bash bin/add-repo.sh foo --stack expo` vytvoří funkční Expo skeleton ready pro `init.sh` z templates/expo-supabase

2. **PMRS-102 (skill-update): per-role scoring v `bin/audit.sh`**
   - Add: role-aware checks. iOS sub-repo nečekat `tsconfig.json` na root + `bun test` — kontrolovat místo toho `app.json`, `eas.json`, `expo-doctor` exit code
   - Acceptance: cutegory-ios audit score reflektuje iOS-specific health, ne nulový

3. **PMRS-103 (skill-update): AGENTS.md template variant pro mobile**
   - Současný AGENTS.md template generický, mobile variant měl by obsahovat: Expo CLI commands cheat sheet, EAS Build/Submit workflow, secret management (EXPO_PUBLIC_ vs Secret env), App Store Connect references, common gotchas
   - Acceptance: `bash bin/add-repo.sh X --stack expo` vytvoří mobile-flavored AGENTS.md

Tyto tři issues jsou **enablery pro budoucí mobile projekty** (klient #2, #3). Pro Cutegory iOS lze manuálně doladit po `add-repo.sh` a fixovat v PMRS až po. Žádné blocker pro start.

---

## Updated Next Steps pro Petra

> **Tyto next steps NAHRAZUJÍ původní seznam na konci §8.**
>
> 1. **Apple Developer enrollment START** (paralelně se vším — největší lead time blocker, $99/year)
> 2. **Schválit Expo-first pivot** — potvrď nebo namítej proti §9 (Native SwiftUI → Expo). Pokud ano:
> 3. **Vytvořit `~/Developer/DEV/templates/expo-supabase/`** (TODO #1, ~1 den AI work). Toto je investment ROI pro každý další mobile projekt.
> 4. **Linear epic "Mobile Skills Foundation (Expo)"** s 9 child issues = 7 P0 skills + 2 zachované (apple-developer-program, app-store-submit). Místo původně 7.
> 5. **Linear epic "PMRS Mobile Support"** s 3 child issues (PMRS-101/102/103 — viz §12.10). Non-blocking pro Cutegory iOS.
> 6. **Po schválení skill epic:** spustit `skill-and-agent-master CREATE mode` per skill v P0 pořadí (1 → 7).
> 7. **Po skill #2 (`expo-supabase-starter`) hotov:** spustit Step 1-3 bootstrap sequence pro Cutegory iOS. Skills #3-7 můžou building paralelně s actual iOS práce.

<!-- Appendix added: 2026-05-25 (evening session) | Author: Petr Rohan + Claude (system-designer agent) | Trigger: 3 new inputs (PMRS ready, Petr nezná Swift, Supabase-first milestone). Replaces §0/§1/§2/§5 recommendations where they conflict. | Sources: Expo docs (docs.expo.dev), expo-supabase-starter (github.com/FlemingVincent/expo-supabase-starter), EAS Build (docs.expo.dev/build/introduction), Supabase RN guide (supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native), NativeWind (nativewind.dev), Petr's existing PMRS (~/Developer/DEV/clients/Cutegory/), Petr's existing templates/ (gl-app-template, cf-tool-template). -->
