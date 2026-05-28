# Expo + Supabase Starters — 2026 Landscape (Verified)

> Researched: 2026-05-25 | Sources: Exa neural search + GitHub raw files + WebFetch
> Firecrawl MCP stale + 0 credits this cycle — fallback: Exa API + WebFetch

---

## TL;DR — Top 3 for Petr's stack

1. **robertguss/mobile-starter-kit-expo-supabase** — Nejblíže Petrovu stacku: Expo 55 + Supabase + NativeWind v4 + TanStack Query + Zustand + EAS (dev/preview/prod) + OTP auth + PostHog + Sentry + Zod. Production-grade architektura, 0 stars ale solid kod.
2. **seaguntech/seaguntech-expo-template** — Expo 54 + NativeWind v5/Tailwind v4 + Supabase + feature-first architektura + RevenueCat + i18n + Vitest + Husky. 16 stars, aktivní 2026-02-25, nejmodernější styling stack.
3. **supabase/supabase official (expo-user-management)** — Autoritativní reference pro Supabase auth patterns, ale legacy (no Expo Router, RNEUI UI, no NativeWind, no EAS). Hodnota: zkopírovat lib/supabase.ts a auth patterns, ne celý template.

**Recommendation for `~/Developer/DEV/templates/expo-supabase/`:**
Fork `robertguss/mobile-starter-kit-expo-supabase` jako base (Expo 55, NativeWind v4, EAS 3-tier, Supabase OTP auth, RLS policy pattern) + přidej feature-first folder structure ze seaguntech + nativewind v5 upgrade.

---

## Detailed Analysis

### 1. robertguss/mobile-starter-kit-expo-supabase

- **Repo:** github.com/robertguss/mobile-starter-kit-expo-supabase
- **Stars:** 0 (nové, March 2026)
- **Last commit:** 2026-03-11
- **Maintainer:** robertguss (experienced Expo educator, ex-Cypress docs)
- **Expo SDK:** ~55.0.5
- **Expo Router:** ^55.0.4
- **Supabase:** @supabase/supabase-js ^2.99.0
- **UI:** NativeWind ^4.2.2 + TailwindCSS 3.4.19
- **Auth methods:** Passwordless email OTP (expo-secure-store, ne AsyncStorage)
- **DB layer pattern:** TanStack Query + Supabase client, MMKV-backed cache
- **State:** Zustand ^5.0.11
- **Forms:** React Hook Form + Zod
- **Analytics:** PostHog + Sentry (oba pre-wired)
- **EAS configured:** YES — 3 profiles (development/preview/production), autoIncrement, appVersionSource: remote
- **TypeScript:** ~5.9.2, strict dle package
- **Testing:** Jest + React Native Testing Library (auth, providers, config, profile)
- **License:** MIT
- **Strengths:**
  - Celý production stack na jednom místě (analytics, error tracking, EAS)
  - expo-secure-store pro tokeny (ne AsyncStorage) — bezpečnostní best practice
  - RLS reminder v README (anon key je public)
  - Protected navigation via Expo Router Stack.Protected
  - 3-tier EAS (dev/preview/prod) ready
  - Feature-folder structure s thin route files
  - OTA update scaffolding
- **Weaknesses:**
  - 0 stars — nízká community validace
  - NativeWind v4, ne nejnovější v5 (seaguntech má v5)
  - Jen OTP auth — žádné OAuth (Google/Apple sign-in)
  - Jeden maintainer, March 2026 = nezjistíme dlouhodobou aktivitu
- **Verdict:** **Fork** — nejblíže Petrovu production stack

---

### 2. seaguntech/seaguntech-expo-template

- **Repo:** github.com/seaguntech/seaguntech-expo-template
- **Stars:** 16 (fork: seagun-tech/seaguntech-expo-template 0 stars)
- **Last commit:** 2026-02-25
- **Maintainer:** quang-pham-dev + seagun-tech (2 kontributoři)
- **Expo SDK:** ~54.0.32
- **Expo Router:** ~6.0.22 (pozor: Expo Router v6 = Expo SDK 54 convention, aktuální)
- **Supabase:** @supabase/supabase-js ^2.93.2
- **UI:** NativeWind 5.0.0-preview.2 + Tailwind v4 (nejmodernější)
- **Auth methods:** Supabase auth (email/password, OAuth options dle README)
- **DB layer pattern:** TanStack Query @tanstack/react-query ^5.90.20
- **State:** Zustand ^5.0.10 + MMKV
- **Forms:** Zod ^4.3.6
- **Payments:** RevenueCat + Stripe
- **i18n:** i18next
- **Testing:** Vitest
- **Dev quality:** ESLint + Prettier + Husky + commit linting
- **Architecture:** feature-first (features/, shared/, config/) — oproti flat structure
- **EAS configured:** Ne explicitně v package.json; prebuild support přes expo CLI
- **TypeScript:** ~5.9.2
- **License:** MIT
- **Strengths:**
  - NativeWind v5 + Tailwind v4 — nejmodernější styling (Petr Tailwind-first)
  - Feature-first architektura — škálovatelnost pro reálné projekty
  - RevenueCat připravený — subscription billing out-of-the-box
  - 2 maintaineré — lepší long-term odds než single-maintainer
  - i18n připraveno od začátku
  - Vitest (rychlejší než Jest)
  - Expo 54 + RN 0.81 — solidní základ
- **Weaknesses:**
  - NativeWind v5 je stále "preview" — potenciální breaking changes
  - Expo SDK 54 (ne 55 jako robertguss) — jeden minor verze pozadu
  - 16 stars — menší komunita než flemingvincent (který ale opustil Supabase)
  - EAS konfigurace není explicitní v README/package.json
  - RevenueCat = overhead pro projekty bez monetizace
- **Verdict:** **Fork/Reference** — pokud chceš nejmodernější styling stack (NativeWind v5)

---

### 3. supabase/supabase expo-user-management (officiální)

- **Repo:** github.com/supabase/supabase/tree/master/examples/user-management/expo-user-management
- **Stars:** N/A (součást main supabase repo — 75k+ stars celkem)
- **Last commit:** aktivní (Supabase core team)
- **Maintainer:** Supabase team (officiální)
- **Expo SDK:** ~55.0.5
- **Expo Router:** NEMÁ — čistý App.tsx, ne Expo Router
- **Supabase:** ^2
- **UI:** @rneui/base + @rneui/themed (React Native Elements) — NE NativeWind
- **Auth methods:** Email/password + magic links dle patterns, Avatar upload
- **DB layer pattern:** Přímý Supabase client volání (bez TanStack Query)
- **EAS configured:** Ne
- **TypeScript:** ~5.9.3
- **License:** Apache 2.0
- **Strengths:**
  - Autoritativní — Supabase team, vždy aktuální s latest Supabase JS SDK
  - Expo 55 (poslední SDK)
  - Obsahuje Postgres Row Level Security patterns (supabase/migrations/)
  - Obsahuje lib/supabase.ts s správnou inicializací (AsyncStorage + autoRefreshToken)
  - Image upload s expo-image-picker + Supabase Storage
- **Weaknesses:**
  - Žádný Expo Router — legacy App.tsx navigation
  - RNEUI UI místo NativeWind
  - Žádný EAS setup
  - Žádný TanStack Query — neškálovatelné data fetching
  - Žádná TypeScript strict konfigurace
  - Minimalistická ukázka, ne production starter
- **Verdict:** **Reference only** — zkopíruj `lib/supabase.ts` a RLS migration patterns, zbytek zahoď

---

### 4. FlemingVincent/expo-supabase-starter ⚠️ MIGRATED

- **Repo:** github.com/FlemingVincent/expo-supabase-starter
- **Stars:** 774 (historicky nejvíce v kategorii)
- **Last commit:** 2026-05-13
- **DŮLEŽITÉ:** **Toto NENÍ Supabase starter od 2026-03-27.** Commit "Supabase to Clerk and Convex (#97)" přemigroval celý repo na Clerk + Convex.
- **Současný stack:** Expo 55, Expo Router 55, Clerk, Convex, TypeScript — BEZ Supabase, BEZ NativeWind
- **Verdict:** **Skip** pro Supabase projekty — repo existuje, ale backend je Clerk+Convex

---

### 5. expo/examples with-legend-state-supabase (bonus)

- **Repo:** github.com/expo/examples/tree/master/with-legend-state-supabase
- **Expo SDK:** Expo team maintained
- **Specifics:** Legend-State reactive state library + Supabase — niche use case
- **Verdict:** **Reference** pokud chceš Legend-State sync patterns

---

## Comparison Table

| Repo | Stars | Updated | SDK | Router | UI | Auth | EAS | Supabase | Verdict |
|------|-------|---------|-----|--------|----|----|-----|---------|---------|
| robertguss/mobile-starter-kit | 0 | 2026-03-11 | 55 | v55 | NativeWind v4 | OTP email | YES (3-tier) | ^2.99 | **Fork** |
| seaguntech/seaguntech-expo-template | 16 | 2026-02-25 | 54 | v6 | NativeWind v5 (preview) | Supabase auth | No explicit | ^2.93 | **Fork/Reference** |
| supabase official expo-user-management | 75k (repo) | active | 55 | None | RNEUI | email+magic | No | ^2 | **Reference** |
| FlemingVincent/expo-supabase-starter | 774 | 2026-05-13 | 55 | v55 | None | Clerk (NOT Supabase) | No | NONE | **Skip** |
| kszongic/expo-supabase-starter | 0 | 2026-03-18 | 52 | Expo Router | basic | email/pw | No | basic | Skip (thin) |

---

## Final Recommendation for `templates/expo-supabase/`

**Strategy: Fork robertguss + selektivní upgrade ze seaguntech**

### Kroky:
1. **Fork** `github.com/robertguss/mobile-starter-kit-expo-supabase` jako základ
2. **Upgrade NativeWind** v4 → v5 (sleduj seaguntech pattern) jakmile v5 vyjde stable
3. **Adopt feature-first** folder structure ze seaguntech (features/, shared/, config/)
4. **Přidej Google/Apple OAuth** — ani jeden starter to nemá, ale Petrovy produkty to budou potřebovat

### Proč robertguss jako base:
1. Expo SDK 55 (nejnovější), EAS 3-tier prepared, NativeWind v4 stable
2. PostHog + Sentry jsou v Petrově stack (Cutegory, Lurki)
3. expo-secure-store místo AsyncStorage = production security baseline
4. TanStack Query + Zustand = Petrův standardní web stack přenesený do mobile

### Files to ADD from GrowLead templates:
- `CLAUDE.md` template structure ze `gl-app-template`
- `biome.json` + `lefthook.yml` ze `cf-tool-template` (robertguss má Prettier, ne Biome)
- `.mcp.json` pattern s supabase + linear serverem
- `docs/FIRST-FORK-RUNBOOK.md` onboarding pattern
- `cubic.yaml` pro review-fleet integrace

### Files to KEEP from robertguss:
- `app/` — Expo Router structure s Stack.Protected
- `lib/supabase.ts` — Supabase client setup (SecureStore-based)
- `lib/auth/` — OTP flow komponenty
- `eas.json` — 3-tier build/submit/update konfigurace
- `app.json` + `app.config.ts`
- `jest.config.ts` + `__tests__/auth/` — auth test coverage

### Missing in all starters (build yourself):
- Apple Sign In (`expo-apple-authentication`)
- Google Sign In (`@react-native-google-signin/google-signin`)
- Push notifications (Expo Notifications + Supabase Edge Function webhook)
- Deep link handling pro magic links na iOS/Android

---

## Sources

- Exa neural search: github.com results for "expo supabase starter 2025 2026 production ready" + "expo router supabase auth template 2026 NativeWind EAS"
- GitHub raw: `raw.githubusercontent.com/robertguss/mobile-starter-kit-expo-supabase/main/package.json`
- GitHub raw: `raw.githubusercontent.com/seaguntech/seaguntech-expo-template/main/package.json`
- GitHub raw: `raw.githubusercontent.com/supabase/supabase/master/examples/user-management/expo-user-management/package.json`
- WebFetch: `github.com/FlemingVincent/expo-supabase-starter/commits/main` (migrace Clerk+Convex 2026-03-27 verified)
- WebFetch: `github.com/robertguss/mobile-starter-kit-expo-supabase` README + eas.json
