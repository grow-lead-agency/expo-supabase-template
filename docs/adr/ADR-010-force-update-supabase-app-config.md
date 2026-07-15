# ADR-010: Force-update gate přes Supabase `app_config` (fail-open)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Issue:** PROD-5165

## Context

Mobilní klient nejde force-refreshnout jako web — jednou nainstalovaná verze žije měsíce.
Když backend udělá breaking change (API kontrakt, auth flow), staré buildy se rozbijí
potichu a bez cesty ven. OTA updates (ADR-008) pokryjí jen JS změny se stejným
runtimeVersion; store build vyžaduje, aby si uživatel appku sám aktualizoval. Chybí
kill-switch: možnost říct „verze < X už nesmí běžet".

Zvažované zdroje remote configu:

1. **Supabase tabulka `app_config`** — Supabase je jediný backend, který má KAŽDÝ fork
   template (auth na něm stojí). Žádná další závislost.
2. **PostHog feature flag** — PostHog je v template volitelný (env-gated); gate na něm
   stavět nejde, fork bez PostHogu by kill-switch neměl.
3. **expo-updates manifest extra** — řeší jen forky s nasazeným EAS Update kanálem a
   nepokryje případ „potřebuju store build" (nový native runtime).

## Decision

Min-version gate čte **Supabase tabulku `public.app_config`** (key-value: `min_version`,
`recommended_version`; migrace `supabase/migrations/20260715000000_app_config.sql`, RLS
SELECT-only pro anon+authenticated). Porovnává se s
`Application.nativeApplicationVersion` (`expo-application`) v `<ForceUpdateGate>`
(root layout):

- `current < min_version` → **blocked**: full-screen overlay, CTA do App Store
  (`extra.appStoreId` z app.json) / Play Store (`android.package`).
- `current < recommended_version` → **nudge**: dismissible banner, app dál použitelná.
- jinak / při chybě → **ok**.

**Fail-open:** JAKÁKOLIV chyba (síť, timeout 3 s, chybějící tabulka, nenumerické verze)
znamená `ok`. Kill-switch, který při výpadku Supabase zablokuje všechny klienty, je
horší vada než opožděný force-update. Logika je čistý TS s dependency injection
(`src/lib/force-update.ts`, bez RN importů) — plně unit-testovatelná (`bun test`).

Dev override: `EXPO_PUBLIC_FORCE_UPDATE_TEST=blocked|nudge` (bundle-time env) pro
manuální i Maestro ověření (`.maestro/force-update.yaml`).

## Consequences

- **Konvence (HARD RULE, viz CLAUDE.md anti-patterns):** API breaking change ⇒ bump
  `min_version` v `app_config` — jinak staří klienti selžou potichu.
- Fork musí aplikovat migraci na svůj Supabase projekt a nastavit `extra.appStoreId`
  (viz FORK-CHECKLIST); bez appStoreId se blocking screen zobrazí bez CTA tlačítka.
- Gate neblokuje first paint — children se renderují hned, overlay se objeví až po
  potvrzeném `blocked` výsledku. Uživatel s mrtvou sítí appku normálně používá.
- `min_version` porovnává `expo.version` (marketing version) — native build number se
  nepoužívá; verzovací konvence z ADR-008 (native změna = bump `expo.version`) tím
  zůstává jediným zdrojem pravdy.
