# expo-supabase-template — Build Plan

> **Linear:** [PROD-2655](https://linear.app/growlead/issue/PROD-2655)
> **Status:** Phases 1-7 complete. Phase 8 (smoke test + GitHub publish) pending.
> **Owner:** Petr + Claude Code agents
> **Target:** Production-ready template, first use = Cutegory iOS

---

## Current status (2026-05-28)

| Phase | Status | Linear |
|---|---|---|
| Phase 1 — Foundation | ✅ Done | PROD-2655 |
| Phase 2 — Skills + agent | ✅ Done | PROD-2685, PROD-2686 |
| Phase 3 — Fork base starter | ✅ Done | PROD-2676 |
| Phase 4 — GrowLead conventions overlay | ✅ Done | PROD-2677 |
| Phase 5 — Stack integration | ✅ Done | (sub-issues) |
| Phase 6 — EAS Build/Submit pipeline | ✅ **Done 2026-05-28** | **PROD-2694** |
| Phase 7 — bin/setup.sh + docs | ✅ **Done 2026-05-28** | **PROD-2695** |
| Phase 8 — Smoke test + GitHub publish | ⏳ Pending | PROD-2696 |

---

## Goal

Postavit `~/Developer/DEV/templates/expo-supabase/` jako 4. Petr's template (sibling k cf-tool-template, gl-app-template, gl-microsite-template). Foundation pro všechny GrowLead iOS/Android projekty.

**Success criteria:**
1. `bun create expo-app new-app --template ~/Developer/DEV/templates/expo-supabase` funguje
2. Bootstrap demo app → Supabase auth flow → EAS preview build → TestFlight install za <30 min
3. Documentace dostatečná aby Petr (ne-Swift dev) za <30 min porozuměl
4. GrowLead conventions match cf-tool / gl-app golden standard
5. `bin/setup.sh --profile=client` interactive setup funguje

---

## Phase 0: Decisions — RESOLVED 2026-05-25

| # | Decision | Final volba | Rationale |
|---|----------|-------------|-----------|
| Q1 | **Apple Developer enrollment** | **Organizational (Rohan Group s.r.o.)** — must request DUNS first | DUNS lead time 5-10 dní (D&B free request). Pak Apple Dev enrollment +1-3 dny. Total ~2 týdny calendar. **START ASAP, paralelně s template build.** |
| Q2 | **EAS subscription tier** | **Free tier (interní app)** | Bude to interní/agency app, ne consumer SaaS. Free limity (~30 builds/mo) stačí pro dev + interní distribuci. Production tier ($29/mo) až pokud nějaký klient půjde do Apple Store / Play Store s častými releases. |
| Q3 | **Bundle ID konvence** | **`cz.{client}.app` (client owns brand)** | Klient drží brand, není vendor lock-in na "growlead" namespace. Pro Cutegory: `cz.cutegory.app`. Pro internal tools: `cz.growlead.{tool}`. |
| Q4 | **Mobile analytics** | **PostHog self-hosted na Coolify** (separate session) | Petr setup v jiné session. Template má PostHog provider + placeholder env vars (`EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`). Klient si vyplní při forku. ADR-006 popíše proč PostHog over Mixpanel/Amplitude. |
| Q5 | **Push notifications** | **Expo Push (managed)** — easy path | Default pro template, klient ho používá. Expo Push proxy přes Expo servers → APNs/FCM, žádný custom setup. Pokud klient potřebuje custom (CF Worker proxy, segmentace), runbook v `docs/runbooks/push-notifications-advanced.md`. |
| Q6 | **iOS widgets v scope template?** | **P1 follow-up po Phase 7** — důležité ale risky | Petr explicitně řekl "důležité". Ale `@bacons/apple-targets` je beta, RN 0.83 crash bug, debug overhead. **Postup:** Template ship-ne first bez widgetů (Phase 7 = MVP). Pak samostatný Linear epic v `expo-supabase-template` projektu: "Pre-wire iOS widgets do template" — Phase 8. Mezitím runbook `docs/runbooks/ios-widgets-howto.md` (kdy a jak per-project přidat). |
| Q7 | **Apple Watch app v scope template?** | **NO** | Alpha tooling, broken framework build phases v `@bacons/apple-targets`. Add jen pokud konkrétní klient explicitně vyžaduje, vlastní engagement. |
| Q8 | **i18n v template?** | **YES — drž i18n všude** | Petr's HARD RULE: "i18n držet všude". Pre-wire `i18next` + `expo-localization` + CZ/EN locale files + jazykový switcher. Skill `i18n-czech` má patterns (pluralizace, skloňování). |

### Phase 0 action items (do start Phase 2)
- [ ] **Petr — START DUNS request** na https://www.dnb.com/duns-number/get-a-duns.html (free, 5-10 dní) pro Rohan Group s.r.o.
- [ ] **Petr — PostHog Coolify setup** v jiné session, output: `EXPO_PUBLIC_POSTHOG_HOST` URL
- [x] **Claude — Update PLAN.md** s decisions (this commit)
- [ ] **Claude — Update README.md** zmiňka i18n + Expo Push v stack tabulce
- [ ] **Claude — Commit research + plan** do `agents-and-skills` repo (template složka může commitnout později, je private nuance)
- [ ] **Claude — Spustit Phase 2** (fork robertguss + cleanup) jako child issue PROD-XXXX

---

## Phase 1: Foundation (this epic — PROD-2655)

Tento dokument + složka + research. ✅ DONE (po commit).

Output:
- ✅ Linear projekt `expo-supabase-template` + epic PROD-2655
- ✅ Folder `~/Developer/DEV/templates/expo-supabase/`
- ✅ `_research/` se 3 dokumenty (architecture + starters + widgets)
- ✅ `README.md` (overview)
- ✅ `PLAN.md` (tento dokument)
- ⏳ Petr rozhodne Q1-Q8

---

## Phase 2: Skills + agent foundation — ✅ DONE 2026-05-25

**Pivot 2026-05-25:** Místo původně plánovaných 9 skills + 1 agent (Petr: "nebudem delat 30 variant") → **1 deep skill + 1 agent** (pattern jako `astro`, `nextjs`, `supabase`, `playwright`).

**Final output:**

### ✅ `expo` skill (PROD-2685 — Done)
- `~/Developer/agents-and-skills/skills/dev/coding/expo/SKILL.md` (45 KB, 1058 LOC)
- 9 reference files (router-patterns, supabase-integration, nativewind, eas-build-submit, apple-developer-setup, dev-workflow, i18n-mobile, push-notifications, sentry-posthog-mobile) — ~12-17 KB each
- `references/sources.md` — 132 URLs logged
- **Total: 5593 LOC across 10 markdown files**
- Coverage: Expo SDK 56 (released 2026-05-21, RN 0.85, React 19.2), Expo Router v5, Supabase mobile, NativeWind v4, EAS Build/Submit, Apple Developer Program, App Store submission, dev workflow, i18n CZ/EN, Sentry mobile, PostHog mobile, Expo Push

### ✅ `expo-master` agent (PROD-2686 — Done)
- `~/Developer/agents-and-skills/skills/dev/coding/expo-master/agent.md` (30 KB, 704 LOC) — workflow routing table, lifecycle phases, decision points, 7 common workflow playbooks, anti-patterns
- `SKILL.md` bridge (POVINNÝ per HARD RULE)
- `references/sources.md`
- Synced do `~/.claude/agents/` ✅

### ✅ Distribution
- `./scripts/sync-skills.sh claude` ran (+9 new skills celkem)
- `./scripts/sync-agents.sh` ran (+2 new agents celkem)
- `./scripts/build-research-index.sh` ran (RESEARCH-INDEX.md: 473 skills, 781 sessions, 7061 URLs)
- Skill `expo` + agent `expo-master` LIVE v Claude Code

### Key research findings
- Expo SDK 56 released 2026-05-21 — major update. Prebuilt XCFrameworks ~16% faster iOS builds. Convex EAS integration.
- AsyncStorage shift: SDK 55→56 oficiálně doporučuje `expo-sqlite/localStorage/install`. Petr's preference jde dál: `expo-secure-store` (Keychain/Keystore hardware-backed) — HARD RULE.
- Expo Go SDK 56 NEMÁ App Store entry k 2026-05. Pro fyzický iPhone test = EAS Development Build povinný (nikoli Expo Go).

---

## Phase 2 (puvodne): Skills + agents foundation (REORDERED 2026-05-25, ARCHIVOVANO)

**Goal:** Postavit 9 mobile skills + `expo-master` agent NEJDŘÍV, než stavíme template. Důvod: Petr's decision (skills-first approach) — Claude Code pak ovládá Expo/Supabase/EAS když buduje template, lepší kvalita + foundation pro budoucí projekty.

**HARD RULE z `agents-and-skills/CLAUDE.md`:** Každý skill MUSÍ mít `references/sources.md` (research log). Agent MUSÍ mít bridge `SKILL.md`. Po build MUSÍ spustit `./scripts/sync-agents.sh` jinak je agent neviditelný.

### 2.1 Skill: `expo-supabase-starter` (P0)
Bootstrap Expo + Supabase project. Boilerplate-aware (zná `templates/expo-supabase/` strukturu).
- Path: `skills/dev/coding/expo-supabase-starter/`
- Triggers: "expo supabase", "nova mobile app", "bootstrap expo", "expo init"
- Routuje na další expo-* skills podle fáze

### 2.2 Skill: `expo-supabase-auth` (P0)
Sign in with Apple, magic links, Google OAuth, session persistence v expo-secure-store.
- Path: `skills/dev/coding/expo-supabase-auth/`
- Triggers: "expo auth", "sign in with apple", "supabase auth mobile", "magic link expo"

### 2.3 Skill: `expo-supabase-data` (P0)
PostgREST queries z RN, RLS patterns (JWT v secure storage), TanStack Query integration, optimistic updates, realtime subscriptions.
- Path: `skills/dev/coding/expo-supabase-data/`
- Triggers: "supabase mobile data", "rls mobile", "tanstack query expo"

### 2.4 Skill: `expo-router` (P0)
File-based routing v5+ patterns. Layouts, modals, protected routes, deep linking, tabs.
- Path: `skills/dev/coding/expo-router/`
- Triggers: "expo router", "file-based routing rn", "mobile navigation", "expo navigation"

### 2.5 Skill: `expo-ui-patterns` (P0)
NativeWind v4 patterns, common mobile components (lists, forms, sheets, modals, toasts), gesture handlers, animations (Reanimated).
- Path: `skills/dev/coding/expo-ui-patterns/`
- Triggers: "nativewind", "mobile ui patterns", "expo ui", "rn components"

### 2.6 Skill: `eas-build` (P0)
EAS Build/Submit setup, 3-tier profiles (dev/preview/prod), signing automation, App Connect API key, secrets management.
- Path: `skills/dev/coding/eas-build/`
- Triggers: "eas build", "eas submit", "expo build", "ipa build", "testflight upload"

### 2.7 Skill: `apple-developer-program` (P0)
Enrollment (individual vs org + DUNS), certs, provisioning profiles, push notification certs, bundle IDs, App Store Connect roles.
- Path: `skills/dev/coding/apple-developer-program/`
- Triggers: "apple developer", "ios certs", "provisioning profile", "duns apple", "app store connect"

### 2.8 Skill: `app-store-submit` (P0)
TestFlight upload, internal/external testers, App Store review submission, metadata (screenshots, descriptions, privacy nutrition labels), versioning.
- Path: `skills/dev/coding/app-store-submit/`
- Triggers: "app store submit", "testflight", "app store review", "ios release", "play store submit"

### 2.9 Skill: `expo-dev-workflow` (P0 — NEW addition)
Jak vidět vývoj — Expo Go QR, Simulator, EAS dev build, React Native DevTools, Reactotron, Flipper alternatives, Sentry mobile, PostHog session replays. **Tento skill řeší tu Petr's otázku "jak se to testuje".**
- Path: `skills/dev/coding/expo-dev-workflow/`
- Triggers: "expo dev", "mobile dev workflow", "rn debugging", "how to test rn", "jak testovat mobile"

### 2.10 Agent: `expo-master` (P0)
Top-level mobile/Expo orchestrátor. Routuje na 9 sub-skills podle fáze (bootstrap → auth → data → UI → build → submit → testing). Sibling k `cloudflare`, `figma`, `kubernetes` masters.
- Path: `skills/dev/coding/expo-master/agent.md` + `SKILL.md` (bridge)
- Triggers: "mobile app", "expo project", "ios android app", "rn app", "react native projekt"
- Model: sonnet (orchestrátor, ne deep technical)

### Phase 2 deliverables
- ✅ 9 skills v `agents-and-skills/skills/dev/coding/expo-*/`
- ✅ 1 agent (`expo-master`) + bridge SKILL.md
- ✅ Každý má `references/sources.md` (research log)
- ✅ `./scripts/sync-agents.sh` spuštěn (agent live)
- ✅ `./scripts/sync-skills.sh claude` spuštěn (skills live v Claude Code)
- ✅ `./scripts/build-research-index.sh` regenerovaný RESEARCH-INDEX.md
- ✅ 10 Linear child issues PROD-2666..2675 (1 per skill/agent) → status Done po build

Estimate: ~6-8h AI work, ~3 review iterations s Petrem.

---

## Phase 3: Fork base starter (template build) (child issue PROD-2676)

**Goal:** Local fork base starter, strip nepotřebné.

Steps:
1. `git clone https://github.com/robertguss/mobile-starter-kit-expo-supabase` do `_fork/`
2. Analyze structure (souborový strom, deps, scripts)
3. Decide: full fork in-place vs cherry-pick best parts
4. Apply cleanups:
   - Remove demo screens nepotřebné pro template
   - Strip robertguss-specific branding
   - Strip PostHog/Sentry credentials hardcodes
   - Move app code do `app/` (Expo Router convention)
5. Verify: `bun install` + `bunx expo start` funguje na čistém forku

Output: working Expo skeleton bez branding, ready pro GrowLead conventions overlay.

Estimate: ~2-3h AI work (Claude Code), 1 review iteration s Petrem.

---

## Phase 4: GrowLead conventions overlay (child issue PROD-2677)

**Goal:** Apply Petr's standard convention files.

Soubory ke zkopírování z `cf-tool-template`:
- `biome.json` — verbatim (lint+format config, idempotent)
- `lefthook.yml` — adapt pro Expo (pre-commit: biome + tsc; pre-push: tests)
- `tsconfig.json` — strict mode + path aliases (`@/`, `@app/*`, `@components/*`)
- `.gitignore` — Expo + Xcode patterns + GrowLead standard
- `.editorconfig`
- `bun.lock` — regenerate clean

Soubory ke zkopírování z `gl-app-template`:
- `cubic.yaml` — Cubic dev review configuration (adapt scope tags pro mobile)
- `.github/workflows/` template patterns (lint + tsc + EAS preview build)

Nové soubory:
- `CLAUDE.md` — single source of truth pro AI (stack, commands, conventions, ADRs)
- `AGENTS.md` — multi-CLI handbook (generated from CLAUDE.md)
- `GEMINI.md` — thin pointer na AGENTS.md (Petr's multi-CLI pattern)
- `.codex/config.toml` — Codex CLI config (sandbox, MCP)
- `.mcp.json` — Supabase MCP per-project (klient vyplní project ref při forku)
- `LICENSE` (MIT)
- `package.json` — base deps + scripts (clean)

Output: GrowLead-branded Expo skeleton s plnou AI multi-CLI ready conventions.

Estimate: ~3-4h AI work.

---

## Phase 4: Stack integration (child issues #3-7)

Každá vrstva = vlastní child issue:

### 4.1 Supabase integration (child #3)
- `lib/supabase.ts` — supabase-js client setup with expo-secure-store adapter
- `lib/auth.ts` — auth helpers (signIn, signOut, session refresh)
- Auth flow screens: `app/(auth)/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`
- Protected route pattern: `app/(app)/_layout.tsx` se session guard
- Magic links + Sign in with Apple (iOS first-class)
- RLS-aware example query (profiles table read)
- Env config: `.env.example` + `.env.local` template + EAS env vars

### 4.2 NativeWind v4 + design system (child #4)
- Install NativeWind v4, configure `tailwind.config.js`
- Base color palette + spacing scale (match GrowLead design tokens)
- Reusable components: `<Button>`, `<TextInput>`, `<Card>`, `<Sheet>`, `<Toast>`
- Dark mode support (system + manual toggle)
- Typography scale

### 4.3 TanStack Query + Zustand (child #5)
- TanStack Query provider setup
- Example data fetching pattern (profiles.list, profiles.get)
- Optimistic update example
- Zustand store pattern (UI state, ne data)
- DevTools integration (dev only)

### 4.4 Expo Router patterns (child #6)
- File-based routing structure (`(auth)`, `(app)`, `(modal)`)
- Modal pattern (`presentation: 'modal'`)
- Tab navigation pattern
- Deep linking config (basic, ne universal links yet)
- 404 fallback

### 4.5 Sentry + PostHog (child #7)
- Sentry mobile SDK init (`sentry.mobile.config.ts`)
- Source maps upload v EAS Build hook
- PostHog provider setup
- Event taxonomy doc (`docs/analytics-events.md`)
- Privacy controls (opt-out, GDPR-aware)

Estimate: ~6-8h AI work total, 1 review per phase s Petrem.

---

## Phase 5: EAS Build/Submit pipeline (child issue #8)

**Goal:** 3-tier build pipeline working end-to-end.

Setup:
- `eas.json` se 3 profiles: `development`, `preview`, `production`
- `app.json` config (bundle ID placeholder, scheme, slug, build numbers)
- Auto-increment build number na produkční builds
- Environment variables per profile (`.env.development`, `.env.preview`, `.env.production`)
- EAS Secrets management script (`bin/eas-secrets.sh`)

Testing:
- `eas build --profile development --platform ios` — internal distribution
- `eas build --profile preview --platform ios` — TestFlight ready
- `eas build --profile production --platform ios` — App Store ready
- Same pro Android

Output: working `.ipa` + `.apk` artefakty + auto-submit pipeline.

Estimate: ~2-3h AI work + Petr's first Apple Developer login.

---

## Phase 6: bin/setup.sh + docs (child issue #9)

**Goal:** Interactive fork setup script.

`bin/setup.sh` features:
- Interactive prompts (project name, bundle ID, Supabase project ref)
- Profile selection (`--profile=client` / `--profile=internal` / `--profile=demo`)
- Auto-generate `app.json` z template
- Auto-generate `.env.local` placeholders
- Optional: GitHub repo creation (`--gh-repo myorg/my-app`)
- Optional: EAS project creation (`--eas-init`)
- Optional: Supabase project linking (`--supabase-link`)
- Push secrets do GitHub Secrets + EAS Secrets

`docs/`:
- `FIRST-FORK-RUNBOOK.md` — 8 sequential commands, ~30 min walkthrough
- `FORK-CHECKLIST.md` — terse version for fork #2+
- `CLAUDE.md` — template-level work workflow
- `adr/ADR-001-expo-router.md` — Why Expo Router over React Navigation
- `adr/ADR-002-nativewind.md` — Why NativeWind over Tamagui/Gluestack
- `adr/ADR-003-expo-secure-store.md` — Why ne AsyncStorage (HARD RULE rationale)
- `adr/ADR-004-supabase-auth.md` — Auth strategy + Sign in with Apple integration
- `adr/ADR-005-eas-vs-fastlane.md` — Why EAS over Fastlane/Xcode Cloud
- `runbooks/eas-build-troubleshooting.md`
- `runbooks/supabase-rls-patterns-mobile.md`
- `runbooks/apple-developer-setup.md`

Estimate: ~3-4h AI work.

---

## Phase 7: Smoke test (child issue #10)

**Goal:** End-to-end validation.

Test scenario:
1. Fresh fork: `bun create expo-app smoke-test --template ~/Developer/DEV/templates/expo-supabase`
2. `cd smoke-test && bin/setup.sh --profile=demo --supabase-project=<test-ref>`
3. `bun run dev:ios` — Simulator loaduje, sign-up funguje
4. `bun run lint && bun run typecheck` — green
5. `eas build --profile preview --platform ios` — successful build
6. Install na fyzické zařízení přes TestFlight
7. Sign-in flow funguje, protected screen loaduje, session persistence funguje

Pass criteria: vše projde bez ručních fixes. Pokud cokoliv selže → fix v template, ne v smoke test app.

Output: template marked as **production-ready** v README badge.

Estimate: ~2-3h AI work + Petr's TestFlight test.

---

## Phase 8: First real use — Cutegory iOS (SEPARATE EPIC, ne v tomto projektu)

Po Phase 7 → Cutegory iOS bootstrap (separate Linear epic v Cutegory projektu):
1. Apple Developer enrollment finalized (paralelně běželo)
2. `cd ~/Developer/DEV/clients/Cutegory && bash bin/add-repo.sh cutegory-ios`
3. Override Bun → Expo template v PMRS add-repo flow (TODO PMRS-101)
4. `cd cutegory-ios && bun create expo-app . --template ~/Developer/DEV/templates/expo-supabase`
5. First milestone: Supabase auth + first protected screen + TestFlight build

Tohle už není scope tohoto template projektu — je to ROI realizace.

---

## Risks & blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apple Developer enrollment delay (org DUNS) | Medium | High (blocks TestFlight smoke) | Start ASAP, paralelně s template build |
| Expo SDK 56 breaking changes během build | Low | Medium | Pin SDK 55 v template; upgrade jako issue |
| EAS Build free tier limit reached | Low | Low | Production tier $29/mo pokud potřeba |
| Supabase mobile RLS edge cases | Medium | Medium | Reference patterns z Lurki / Cutegory backoffice; runbook v docs/ |
| NativeWind v4 vs v5-preview decision drift | Low | Low | Stick s v4 stable; v5 jako post-template upgrade |
| `bun create expo-app --template` API změny | Low | Medium | Fallback: ruční `cp -r` jako u gl-microsite-template |

---

## Estimated total effort (AI work)

| Phase | Estimated AI time |
|-------|-------------------|
| Phase 1 (this) | ~30 min (DONE) |
| Phase 2 (fork & cleanup) | ~3h |
| Phase 3 (GrowLead conventions) | ~4h |
| Phase 4 (stack integration, 5 sub-issues) | ~7h |
| Phase 5 (EAS pipeline) | ~3h |
| Phase 6 (bin/setup.sh + docs) | ~4h |
| Phase 7 (smoke test) | ~3h |
| **Total** | **~24h AI work** |

**Lidský odhad (Petr's calendar time):** 1-2 týdny (s reviews + Apple Developer setup + paralelní práce).

---

## Next action

**Petr odpoví na Q1-Q8 v Phase 0** → spustíme Phase 2 jako child issue v PROD-2655.

---

<!-- Origin: GrowLead | Linear: PROD-2655 | Created: 2026-05-25 | Last update: 2026-05-25 -->
