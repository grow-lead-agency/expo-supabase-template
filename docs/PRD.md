# PRD — expo-supabase-template v1.1 „Hardening Wave"

> **Typ:** STANDARD (infra/tool template) — delta PRD nad v1.0 (build plan viz `PLAN.md`)
> **Linear projekt:** [expo-supabase-template](https://linear.app/growlead/project/expo-supabase-template-791992ff10e2)
> **Epic v1.0:** PROD-2655 (Done) · **Epic v1.1:** [PROD-5060](https://linear.app/growlead/issue/PROD-5060)
> **Verze:** 1.1-draft · **Datum:** 2026-07-12 · **Autor:** Petr + Claude (Fable 5 review)
> **last_verified:** 2026-07-12

---

## Section Index

| § | Sekce | Obsah |
|---|-------|-------|
| 1 | Product Identity | Co template je a pro koho |
| 2 | Proč v1.1 | Nálezy Fable review 2026-07-12 |
| 3 | Cíle & Success Metrics | Měřitelná kritéria hotovosti |
| 4 | Scope v1.1 | P0/P1/P2 requirements |
| 5 | Non-goals | Co v1.1 nestavíme |
| 6 | Rizika & závislosti | |
| 7 | Rollout Status | Fáze × Linear |
| 8 | Decision Log | Odkazy na ADRs |
| 9 | Changelog | |

---

## §1 Product Identity

| | |
|---|---|
| **Produkt** | `expo-supabase-template` — GrowLead boilerplate pro mobilní apky |
| **Pro koho** | Petr + AI agenti bootstrapující klientské/interní iOS+Android apky |
| **Job-to-be-done** | Od `git clone` k funkční appce na TestFlightu za < 30 minut, s GrowLead konvencemi (Bun, Biome, Lefthook, multi-CLI kontext, i18n CZ/EN) předinstalovanými |
| **Sourozenci** | cf-tool-template (mini-SaaS), gl-app-template (full-stack SaaS), gl-microsite-template (Astro) |
| **První konzument** | Cutegory iOS |

Positioning: Pro GrowLead projekty, které potřebují mobilní apku, je tento template jediný startovací bod — ne komunitní startery, ne greenfield. Template je **norma**, ne inspirace.

## §2 Proč v1.1 — nálezy review (2026-07-12)

Fable review celého repa našel rozpor mezi deklarovaným stavem („production-ready" badge) a realitou. Klíčový nález: **default auth flow (magic link, ADR-004) nejde dokončit** — e-mailový redirect míří na hardcoded placeholder scheme a v aplikaci neexistuje žádný deep-link handler, který by session vytvořil. Dále: Sentry je mrtvý kód (nikdo nevolá init), referenční sign-in screen porušuje vlastní konvenci RHF+Zod, EAS channels jsou definované bez `expo-updates` (OTA nefunguje), nula testů, CI neodpovídá org security baseline (chybí security gate, actions nejsou SHA-pinned — org má sha_pinning enforcement).

Root cause: Phase 8 (end-to-end smoke test) byla uzavřena bez reálného fork → login → TestFlight cyklu. (Stav Phase 8 je nekonzistentní i napříč evidencí: Linear PROD-2696 = Done, PLAN.md = Pending — R8 to sjednocuje re-runem.) Druhá vrstva root cause: v1.0 vznikl jako **rebuild informed by** komunitní startery, ne skutečný git fork — rozhodnutí se převzala, ale hotová práce base starteru (testy, OTP auth robustnost) se ztratila. v1.1 = uzavření mezery mezi slibem a realitou.

## §3 Cíle & Success Metrics

| Metrika | Teď (v1.0) | Cíl (v1.1) |
|---|---|---|
| Magic link login dokončitelný na zařízení | ❌ | ✅ ověřeno na reálném iOS zařízení |
| Sentry hlásí chyby z production buildu | ❌ (dead code) | ✅ testovací error viditelný v Sentry |
| OTA update doručitelný bez store review | ❌ | ✅ `eas update` na preview channel funguje |
| Automatizované testy | 0 | ≥ 1 Maestro smoke flow + unit testy chunked storage adapteru |
| CI odpovídá Security Baseline | ❌ | ✅ security gate + gitleaks + SHA-pinned actions + dependabot |
| Ostrý fork end-to-end | nikdy neproběhl | ✅ 1 kompletní fork → login → TestFlight, čas ≤ 30 min změřen |
| Template učí vlastní konvence | sign-in porušuje RHF+Zod | ✅ všechny vzorové obrazovky konzistentní s CLAUDE.md pravidly |

## §4 Scope v1.1

### P0 — Rozbité sliby (blokuje „production-ready")

**R1. Magic link auth dokončení.** Deep-link callback routa, která z příchozího linku vytvoří session (PKCE flow). Redirect URL se odvozuje z Expo scheme za runtime — žádný hardcoded placeholder, žádná závislost na sed náhradě v setup skriptu. Akceptace: fork s reálným Supabase projektem → e-mail → klik → přihlášený uživatel na dashboardu. Detail: ADR-007.

**R2. Sentry default-on.** Init + wrap root layoutu + globální error boundary napojený na Sentry capture. Env-gated no-op bez DSN (stejný pattern jako PostHog) — fork bez Sentry nic nestojí. Akceptace: production build s DSN hlásí testovací error. Detail: ADR-009.

**R3. Referenční sign-in screen podle vlastních konvencí.** React Hook Form + Zod validace (nahrazuje ruční useState). Stav „e-mail odeslán" má cestu zpět (překlep v adrese). Apple Sign-In: rozhodnout complete-or-remove — buď plná integrace (dependency + plugin + tlačítko), nebo odstranit helper a nechat jako dokumentovaný opt-in. 🔶 Assumption: pro v1.1 volíme „remove + runbook", protože magic link je default a Apple SI vyžaduje placený Apple Dev účet, který fork nemusí mít.

### P1 — Produkční provoz

**R4. OTA updates.** `expo-updates` + runtimeVersion policy + update skripty pro preview/production channels. Největší operační výhra: JS fix bez store review. Detail: ADR-008.

**R5. Testovací vrstva.** Maestro smoke flow (app se spustí, sign-in se vyrenderuje, jazykový switcher funguje) + unit testy pro chunked SecureStore adapter (chunking/reassembly/remove). Pre-push hook přestává být noop.

**R6. Security & CI baseline.** security workflow (TruffleHog + Semgrep), gitleaks v pre-commit, SHA-pinned GitHub Actions (org enforcement), dependabot config, Node 22 v EAS buildech (Node 20 je EOL od jara 2026).

### P2 — Konzistence & DX

**R7. DX polish balíček:** FlashList jako dependency (anti-pattern tabulka ho vyžaduje), příkladový Zustand store, `+not-found` routa, oprava docs driftu (Router verzování, mrtvý odkaz na docs/CLAUDE.md, quickstart příkaz), doctor check na nezaměněné placeholdery.

**R8. Ostrý fork smoke test (re-run Phase 8).** Kompletní cyklus fork → setup → login → EAS preview → TestFlight na reálném zařízení, se stopkami. Teprve po něm zůstává „production-ready" badge. 🔵 Open Question: který projekt bude smoke-test vehikl — Cutegory iOS, nebo throwaway demo?

## §5 Non-goals (v1.1)

- **Widgets/Live Activities rozšíření** — zůstává opt-in přes setup skript, beta status `@bacons/apple-targets` se nemění.
- **Push notifications advanced** (CF Worker proxy, segmentace) — Expo Push managed stačí, runbook až na konkrétní poptávku.
- **Apple Watch** — trvale mimo scope (PLAN.md Q7).
- **Upgrade Tailwind na v4 / NativeWind v5** — pin zůstává (ADR-002), revize až NativeWind v5 stable.
- **Monorepo/NX integrace** — template je single-package záměrně.

## §6 Rizika & závislosti

| Riziko/závislost | Dopad | Mitigace |
|---|---|---|
| Ostrý fork vyžaduje Apple Dev účet (Rohan Group) | R8 blokován | DUNS/enrollment tracked v PROD-2664; do té doby smoke test end-uje na simulátoru + EAS buildu |
| `expo-updates` + React Compiler + new arch kombinace | build regrese | Otestovat na preview channel před merge |
| Maestro na CI (macOS runner cena) | CI náklady | Maestro lokálně + v CI jen lint/typecheck/unit; Maestro jako pre-release gate |
| PKCE flow vyžaduje správný Supabase redirect allowlist | login fail | Krok v FIRST-FORK-RUNBOOK: přidat scheme URL do Supabase Auth settings |

## §7 Rollout Status

| Fáze | Obsah | Status | Linear |
|---|---|---|---|
| v1.1-P0 | R1 magic link, R2 Sentry, R3 sign-in konvence | ⏳ Planned | PROD-5060 (sub-issues R1-R3) |
| v1.1-P1 | R4 OTA, R5 testy, R6 security CI | ⏳ Planned | PROD-5060 (sub-issues R4-R6) |
| v1.1-P2 | R7 DX polish, R8 ostrý fork | ⏳ Planned | PROD-5060 (sub-issues R7-R8) |

## §8 Decision Log

| # | Rozhodnutí | ADR | Datum |
|---|---|---|---|
| D1 | Expo Router file-based | ADR-001 | 2026-05-28 |
| D2 | NativeWind v4 + Tailwind 3.4 pin | ADR-002 | 2026-05-28 |
| D3 | Chunked expo-secure-store | ADR-003 | 2026-05-28 |
| D4 | Magic link jako default auth | ADR-004 | 2026-05-28 |
| D5 | EAS over Fastlane | ADR-005 | 2026-05-28 |
| D6 | PostHog self-hosted pro analytics (backfill) | ADR-006 | 2026-07-12 |
| D7 | PKCE deep-link completion pro magic link | ADR-007 | 2026-07-12 |
| D8 | expo-updates OTA jako součást template | ADR-008 | 2026-07-12 |
| D9 | Sentry wired default-on (env-gated) | ADR-009 | 2026-07-12 |

## §9 Changelog

| Datum | Verze | Co se změnilo | Trigger |
|---|---|---|---|
| 2026-05-28 | v1.0 | Template postaven (PLAN.md fáze 1-7; Phase 8 uzavřena bez reálného cyklu) | PROD-2655 |
| 2026-07-12 | v1.1-draft | Delta PRD: hardening wave po Fable review — P0 broken promises, P1 ops, P2 DX | Fable 5 template review |
