# expo-supabase-template

[![Status](https://img.shields.io/badge/status-v1.1--hardening-orange)](#status)
[![Multi-CLI Ready](https://img.shields.io/badge/AI-Multi--CLI%20Ready-blue?logo=anthropic)](./AGENTS.md)
[![Linear](https://img.shields.io/badge/Linear-PROD--2655-5E6AD2?logo=linear)](https://linear.app/growlead/issue/PROD-2655)

> **Boilerplate pro Expo (React Native) + Supabase mobile apps.**
> Od `git clone` k working iOS app na TestFlight za **< 30 minut**.

Foundation pro všechny GrowLead iOS/Android projekty. Sibling k:
- [`cf-tool-template`](../cf-tool-template/) — mini-SaaS na Cloudflare
- [`gl-app-template`](../gl-app-template/) — full-stack SaaS (NX monorepo)
- [`gl-microsite-template`](../gl-microsite-template/) — brand microsites (Astro)

Postaveno na principech: **AI-first** (Petr neumí Swift, ale umí React), **cross-platform** (iOS + Android jeden codebase), **production-grade** (EAS, Sentry, RLS).

---

## Status

🟠 **v1.1 Hardening Wave in progress.** v1.0 build complete (fáze 1-7), ale Fable review (2026-07-12)
našel gap mezi deklarovaným a reálným stavem — viz [`docs/PRD.md`](./docs/PRD.md). Production-ready
badge se vrátí po dokončení R8 (ostrý fork → login → TestFlight se stopkami).

Tracking: [PROD-2655](https://linear.app/growlead/issue/PROD-2655) (v1.0, Done) + [PROD-5060](https://linear.app/growlead/issue/PROD-5060) (v1.1) v Linear projektu [`expo-supabase-template`](https://linear.app/growlead/project/expo-supabase-template-791992ff10e2).

## Quick links

- [`docs/FIRST-FORK-RUNBOOK.md`](./docs/FIRST-FORK-RUNBOOK.md) — first-time fork walkthrough (8 sequential commands, ~30 min)
- [`docs/FORK-CHECKLIST.md`](./docs/FORK-CHECKLIST.md) — fork #2+ terse checklist
- [`docs/PRD.md`](./docs/PRD.md) — PRD v1.1 „Hardening Wave" ([PROD-5060](https://linear.app/growlead/issue/PROD-5060))
- [`docs/adr/`](./docs/adr/) — Architecture decisions (9 ADRs)
- [`docs/runbooks/`](./docs/runbooks/) — Ops playbooks (EAS troubleshooting, RLS patterns, Apple Dev setup)
- [`CLAUDE.md`](./CLAUDE.md) — AI assistant context
- [`PLAN.md`](./PLAN.md) — Build plan + phase tracking

**Research artefakty** v [`_research/`](./_research/):
- [`MOBILE-ARCHITECTURE.md`](./_research/MOBILE-ARCHITECTURE.md) — system-designer output (1301 řádků, 5903 slov)
- [`starters-and-widgets/expo-supabase-starters-2026.md`](./_research/starters-and-widgets/expo-supabase-starters-2026.md) — top 3 finalists analysis
- [`starters-and-widgets/expo-ios-widgets-2026.md`](./_research/starters-and-widgets/expo-ios-widgets-2026.md) — iOS widgets/Live Activities feasibility

---

## Stack (final)

| Vrstva | Volba | Důvod |
|--------|-------|-------|
| **Runtime** | Expo SDK 55+ (managed workflow) | AI-friendly, single codebase iOS+Android |
| **Routing** | Expo Router v5 (file-based) | Analog Next.js App Router → Petr know-how |
| **Backend** | Supabase (auth + data + RLS + realtime + storage) | Existing GrowLead default |
| **UI styling** | NativeWind v4 (Tailwind pro RN) | Match webová appka (cf-tool, gl-app) |
| **Data fetching** | TanStack Query v5 | Stejně jako web stack |
| **State** | Zustand | Lightweight, no boilerplate |
| **Session storage** | `expo-secure-store` | HARD RULE — NE AsyncStorage |
| **Forms** | React Hook Form + Zod | Match web conventions |
| **Build/Deploy** | EAS Build/Submit (3-tier: dev/preview/prod) | Vyřeší signing automaticky |
| **Error tracking** | Sentry mobile SDK | Integration s [sentry-mastery](../../../agents-and-skills/skills/tools/sentry-mastery/) skill |
| **Analytics** | PostHog (self-hosted na Coolify) | GrowLead-wide instance, sdílená mobile + web. ADR-006 detail. |
| **Push notifications** | Expo Push (managed) | Default. Expo proxy → APNs/FCM. CF Worker proxy jako advanced option. |
| **i18n** | i18next + expo-localization | CZ/EN pre-wired (HARD RULE — i18n držet všude). [`i18n-czech`](../../../agents-and-skills/skills/dev/coding/i18n-czech/) skill pro pluralizaci/skloňování. |
| **Lint/Format** | Biome v2 | Match cf-tool / gl-app conventions |
| **Git hooks** | Lefthook | Match cf-tool / gl-app conventions |
| **PM** | Bun | HARD RULE — žádný npm/yarn/pnpm |
| **TypeScript** | strict mode | HARD RULE |
| **iOS Widgets** | `@bacons/apple-targets` (opt-in via `bin/setup-widgets.sh`) | Beta lib. Pre-wired skeleton in `targets/`, customize per project. See [`docs/runbooks/ios-widgets-howto.md`](./docs/runbooks/ios-widgets-howto.md). |

---

## Quickstart (až bude template hotový)

```bash
# Bootstrap new app from template
bunx create-expo-app@latest my-mobile-app --template ~/Developer/DEV/templates/expo-supabase

# Configure
cd my-mobile-app
bin/setup.sh --profile=client --supabase-project=<ref> --bundle-id=cz.client.app

# Run
bun run dev               # Expo dev server (Metro)
bun run dev:ios           # iOS Simulator
bun run dev:android       # Android Emulator

# Build & deploy
eas build --profile preview --platform ios
eas submit --platform ios --latest
```

> 👥 **Working on the template itself?** Read [`CLAUDE.md`](./CLAUDE.md) + [`docs/PRD.md`](./docs/PRD.md).
> **First fork?** Start at [`docs/FIRST-FORK-RUNBOOK.md`](./docs/FIRST-FORK-RUNBOOK.md) (8 sequential steps).

---

## Why Expo and not native SwiftUI?

Detailed rationale: [`_research/MOBILE-ARCHITECTURE.md`](./_research/MOBILE-ARCHITECTURE.md) §9.

TL;DR:
- Petr umí React → produktivní za týden, ne 3 měsíce
- Single codebase pro iOS+Android (90% kódu sdílený)
- EAS Build vyřeší signing/provisioning hell
- Supabase má first-class RN SDK
- AI agenti píšou RN/Expo skvěle (větší corpus než Swift)
- Pokud projekt potřebuje native widget/Live Activity → `@bacons/apple-targets` umožní přidat native target **bez ejection** (detail v widgets research)

**Když Expo nestačí** (escalate na native): heavy 3D/AR/ML on-device, pixel-perfect Apple Wallet/Live Activities, banking compliance. Cutegory iOS nic z toho nepotřebuje.

---

## Origin & inspiration

Template = **rebuild informed by** community starters + GrowLead conventions. (Pozn. v1.1: nejde
o skutečný git fork — kód vznikl od nuly podle research analýzy `_research/starters-and-widgets/`.
Tím se ztratily části, které base starter měl hotové — testy, OTP auth robustnost; v1.1 je dohání, viz PRD §2.)

1. **Base reference:** [`robertguss/mobile-starter-kit-expo-supabase`](https://github.com/robertguss/mobile-starter-kit-expo-supabase) — Expo SDK 55, NativeWind v4, TanStack Query, Zustand, PostHog + Sentry pre-wired, EAS 3-tier (March 2026)
2. **Folder structure:** [`seaguntech/seaguntech-expo-template`](https://github.com/seaguntech/seaguntech-expo-template) — feature-first architecture, NativeWind v5-preview
3. **Lib patterns:** [`supabase/supabase` expo-user-management](https://github.com/supabase/supabase/tree/master/examples/user-management/expo-user-management) — official lib/supabase.ts initialization

**GrowLead conventions** kopírovat z `cf-tool-template` + `gl-app-template`:
- `CLAUDE.md` + `AGENTS.md` (multi-CLI handbook)
- `biome.json` + `lefthook.yml` (verbatim)
- `tsconfig.json` strict mode
- `.mcp.json` (Supabase MCP + případně Expo EAS MCP)
- `bin/setup.sh` (interactive setup s flagy)
- `docs/FIRST-FORK-RUNBOOK.md` (8 sequential steps)
- `docs/adr/` (ADR-001, ADR-002, ...)
- GitHub Actions CI gates

---

## License

MIT — same as ostatní GrowLead templates.

---

<!-- Origin: GrowLead | Linear: PROD-2655 | Started: 2026-05-25 -->
