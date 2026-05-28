# CLAUDE.md — expo-supabase-template

> Single source of truth for AI assistants working on mobile apps forked from this template.
> Read [AGENTS.md](./AGENTS.md) first if you are a non-Claude agent (Codex, Gemini, Cursor).

## What this is

- Boilerplate template pro Expo (React Native) + Supabase mobile apps.
- Foundation pro vsechny GrowLead iOS/Android projekty.
- Sibling k:
  - [`cf-tool-template`](../cf-tool-template/) — mini-SaaS na Cloudflare
  - [`gl-app-template`](../gl-app-template/) — full-stack SaaS (NX monorepo)
  - [`gl-microsite-template`](../gl-microsite-template/) — brand microsites (Astro)

## Stack (lock — do not deviate without ADR)

| Vrstva | Volba |
|--------|-------|
| **Runtime** | Expo SDK 56+ (managed workflow) |
| **Language** | TypeScript strict mode |
| **Package manager** | Bun (HARD RULE — NE npm/yarn/pnpm) |
| **Routing** | Expo Router v5 (file-based, `src/app/`) |
| **Backend** | Supabase (auth + data + RLS + realtime + storage) |
| **Session storage** | `expo-secure-store` chunked adapter (HARD RULE — NE AsyncStorage) |
| **UI styling** | NativeWind v4 (Tailwind v3.4 pinned — NE v4) |
| **Animations** | Reanimated 4 + `react-native-worklets/plugin` (NE `react-native-reanimated/plugin`) |
| **Data fetching** | TanStack Query v5 |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **i18n** | i18next + expo-localization (CZ/EN, ICU plural CLDR — HARD RULE) |
| **Error tracking** | Sentry mobile SDK |
| **Analytics** | PostHog (self-hosted na `posthog.growlead.cz`) |
| **Push notifications** | Expo Push (managed) |
| **Build/Deploy** | EAS Build/Submit (3-tier: dev/preview/prod) |
| **Lint/Format** | Biome v2 |
| **Git hooks** | Lefthook |
| **Bundle ID** | `cz.{client}.app` convention |

## Commands

```bash
bun install                # Install deps
bun run dev                # Metro bundler + Expo dev server (QR for Expo Go)
bun run dev:ios            # Open iOS Simulator
bun run dev:android        # Open Android Emulator
bun run dev:web            # Open in browser
bun run lint               # Biome check
bun run lint:fix           # Biome auto-fix
bun run typecheck          # tsc --noEmit
bun run format             # Biome format --write
bun run prebuild           # Generate native ios/ + android/ dirs

# EAS (after `bunx eas-cli login`)
eas build --profile development --platform ios     # Internal dev build
eas build --profile preview --platform ios          # TestFlight-ready
eas build --profile production --platform ios       # App Store-ready
eas submit --platform ios --latest                  # Upload to TestFlight
```

## Coding conventions

- **TypeScript strict** — no `any`, no `process.env.X!` non-null assertions; check + throw instead.
- **Functional components only** — no class components.
- **File-based routing** v `src/app/` (Expo Router v5).
- **Layout groups:** `(auth)` for unauthenticated, `(app)` for authenticated.
- **NativeWind classes** pro ALL styling — no `StyleSheet.create`.
- **Forms** via React Hook Form + Zod schema.
- **Server state** via TanStack Query, **client state** via Zustand.
- **All user-facing text** via i18next (`t('key')`) — NIKDY hardcoded strings.
- **Secrets** v `.env.local` (gitignored) — placeholder v `.env.local.example`.
- **Path aliases:** `@/*` → `src/*`, `@lib/*` → `src/lib/*`, `@components/*` → `src/components/*`.

## Anti-patterns (do NOT do)

| Anti-pattern | Correct approach |
|---|---|
| AsyncStorage pro session | Chunked `expo-secure-store` adapter (`src/lib/storage/secure-chunked.ts`) |
| `react-native-reanimated/plugin` | `react-native-worklets/plugin` (last in babel plugins array) |
| `tailwindcss@^4` | `tailwindcss@^3.4` (NativeWind v4 inkompatibilita s v4) |
| `process.env.X!` | `const X = process.env.X; if (!X) throw new Error('X not set');` |
| `StyleSheet.create({...})` | NativeWind `className="..."` |
| Hardcoded UI strings | i18next `t('key')` keys v `src/locales/cs.json` + `en.json` |
| `useColorScheme` z `react-native` | `useColorScheme` z `nativewind` |
| `FlatList` pro >50 items | `@shopify/flash-list` |
| `npm install` / `yarn add` | `bun add` / `bunx expo install` |

## When to use which skill

- **Stack patterns** (Expo SDK, NativeWind, Supabase auth, EAS) → `expo` skill
- **Multi-step workflow** (bootstrap, EAS submit, App Store review) → `expo-master` agent
- **Supabase deep dive** (RLS, migrations, Edge Functions) → `supabase` skill
- **Auth deep dive** (Sign in with Apple, magic links, Google) → `auth-supabase-cf` skill
- **Czech pluralization / CLDR rules** → `i18n-czech` skill
- **Code review** → `cr` slash command (turbo mode)

## Forking workflow

1. **Bootstrap:**
   ```bash
   bun create expo-app my-app --template ~/Developer/DEV/templates/expo-supabase
   ```
   (Or via GitHub "Use this template" button if pushed to GitHub.)

2. **Configure** (interactive setup script — Phase 7):
   ```bash
   cd my-app && bin/setup.sh --profile=client --bundle-id=cz.client.app
   ```

3. **Run:**
   ```bash
   bun run dev:ios     # Simulator
   ```

4. **First build** (after Apple Developer enrollment):
   ```bash
   eas build --profile preview --platform ios
   eas submit --platform ios --latest
   ```

Detailed walkthrough: `docs/FIRST-FORK-RUNBOOK.md` (Phase 7).

## Project structure

```
src/
├── app/                    # Expo Router v5 (file-based routing)
│   ├── _layout.tsx         # Root: providers, i18n, Sentry, PostHog, QueryClient
│   ├── (auth)/             # Unauthenticated group
│   │   ├── _layout.tsx     # Redirect to /(app) if logged in
│   │   └── sign-in.tsx     # Magic link + Apple sign-in
│   └── (app)/              # Authenticated group
│       ├── _layout.tsx     # Redirect to /(auth)/sign-in if NOT logged in
│       └── index.tsx       # Dashboard
├── components/             # Reusable UI (NativeWind)
├── hooks/                  # Custom hooks (use-auth, ...)
├── lib/                    # Lib modules
│   ├── supabase.ts         # Supabase client + chunked SecureStore adapter
│   ├── auth.ts             # Auth helpers
│   ├── i18n.ts             # i18next init
│   ├── posthog.ts          # PostHog provider wrapper
│   ├── query-client.ts     # TanStack Query setup
│   └── storage/
│       └── secure-chunked.ts  # 2KB-chunking adapter for Android SecureStore
├── locales/                # i18n JSON files
│   ├── cs.json
│   └── en.json
└── global.css              # Tailwind directives
```

## HARD RULES checklist (per Petr 2026-05-28)

- [x] Bun (NIKDY npm/yarn/pnpm)
- [x] TypeScript strict
- [x] `expo-secure-store` chunked adapter (NIKDY AsyncStorage)
- [x] i18n vsude (CZ/EN, ICU plural)
- [x] Tailwind v3.4 pinned (NIKDY v4)
- [x] `react-native-worklets/plugin` (NIKDY reanimated/plugin)
- [x] `global.d.ts` s CSS module shim (`declare module '*.css';`)
- [x] Bundle ID `cz.{client}.app`
- [x] EAS Free tier (interní apps)
- [x] PostHog self-hosted (`posthog.growlead.cz`)
- [x] Apple Developer organizational (Rohan Group s.r.o.)

## Environments

Mobile app sám DNS nepotřebuje. Backend (Supabase Edge Functions, CF Worker proxies) následuje
GrowLead konvenci z `~/Developer/CLAUDE.md`:

- **Staging:** `{hub}.{projekt}-stg.growlead.dev`
- **Production:** `{hub}.{projekt}.growlead.dev`
- **CF zone:** `growlead.dev` (`84f937ea65547e10664b688f4972a1a7`)
- **Supabase:** staging branch z main, separate pooler endpoint

<!-- Origin: GrowLead | Linear: PROD-2691 / PROD-2692 / PROD-2693 | Created: 2026-05-28 -->
