# First Fork Runbook — expo-supabase-template

8 sequential commands, ~30 min from `git clone` to working dev environment.

## Prerequisites (one-time)

- macOS (for Xcode + iOS Simulator)
- Bun ≥1.3 (`curl -fsSL https://bun.sh/install | bash`)
- Xcode (App Store, free, ~10 GB) + Command Line Tools (`xcode-select --install`)
- Expo Go app on physical iPhone (App Store, free) — NOTE: SDK 56 Expo Go may not be available; use EAS Dev Build instead
- Apple Developer account (organizational + DUNS for new clients; or use personal for dev)
- Supabase project created at supabase.com (or use existing)
- GitHub repo (optional, can create via setup.sh)

## Step 1: Bootstrap

```bash
bun create expo-app my-app --template ~/Developer/DEV/templates/expo-supabase
cd my-app
```

Verify: `package.json` exists, `src/app/_layout.tsx` exists.

## Step 2: Interactive setup

```bash
bin/setup.sh
# Answers: App name, slug, scheme, bundle ID, Supabase ref, GitHub repo
```

Or non-interactive:
```bash
bin/setup.sh --profile=client --app-name="Cutegory" --app-slug=cutegory --app-scheme=cutegory --bundle-id=cz.cutegory.app --supabase-ref=abc123xyz --gh-repo=grow-lead-agency/cutegory-ios
```

## Step 3: Fill `.env.local`

```bash
$EDITOR .env.local
```

Required:
- `EXPO_PUBLIC_SUPABASE_URL` (from Supabase dashboard)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (from Supabase dashboard)

Optional (can leave empty for now):
- `EXPO_PUBLIC_SENTRY_DSN` (from sentry.io, project: mobile)
- `EXPO_PUBLIC_POSTHOG_KEY` (from posthog.growlead.cz)
- `APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID` (needed for `eas submit`)

## Step 4: Push secrets to EAS

```bash
bin/eas-secrets.sh
```

Verify they made it: `eas secret:list`

## Step 4.5: Configure Supabase Auth (magic link + OTP)

In the Supabase dashboard (per ADR-007):

1. **Auth → URL Configuration → Redirect URLs** — add `{your-scheme}://auth/callback`.
   Without this, magic links fall back to the Site URL and never reach the app.
2. **Auth → Email Templates → Magic Link** — make sure the template contains **both**
   `{{ .ConfirmationURL }}` (the link) and `{{ .Token }}` (the 6-digit code). The code is
   the guaranteed fallback when email link scanners or in-app browsers break the deep link.

## Step 5: Run dev server

```bash
bun run dev
```

This starts Metro bundler. Scan QR with Expo Go on iPhone, or press `i` for iOS Simulator.

You should see the sign-in screen.

## Step 6: Test auth flow

In Expo Go / Simulator:
1. Enter your email
2. Tap "Send magic link"
3. Check email — either click the link (deep link → `auth/callback` → session),
   or type the 6-digit code into the app (OTP fallback, works everywhere)
4. App should redirect to dashboard "Hello {email}"

If the magic link doesn't redirect: re-check Step 4.5 (redirect allowlist). The OTP code
path works regardless — if even that fails, the problem is Supabase config, not deep links.

## Step 7: First preview build

```bash
bun run build:preview
```

Takes ~15-20 min. Result: `.ipa` link from EAS.

Install on physical iPhone via TestFlight (or via QR for `eas build` link).

## Step 8: Submit to TestFlight

After Apple Developer account ready (DUNS + enrollment complete):

```bash
bun run submit:ios
```

Petr/testers get TestFlight invite by email.

### Optional: iOS widgets

If your app needs Home Screen widgets, Lock Screen widgets, or Live Activities:

```bash
bin/setup-widgets.sh
```

See [`docs/runbooks/ios-widgets-howto.md`](./runbooks/ios-widgets-howto.md) for full setup.

## Common issues

- **QR doesn't work in Expo Go SDK 56:** Expo Go for SDK 56 not on App Store as of 2026-05. Use EAS Development Build instead (`bun run build:dev`).
- **Supabase magic link doesn't deep-link:** Add `{scheme}://auth/callback` to Supabase Auth URL allow list.
- **Build fails on `react-native-worklets/plugin`:** Verify babel.config.js uses `react-native-worklets/plugin`, NOT `react-native-reanimated/plugin` (SDK 56 changed plugin location).
- **NativeWind classes don't render:** Verify Tailwind v3.4 pinned in package.json (NOT v4 — incompatible with NativeWind v4).
- **AsyncStorage warning:** PostHog imports it transitively; it's fine. Actual session storage uses chunked SecureStore.

## Next steps

- Read `docs/adr/` for architecture decisions
- Read `docs/runbooks/` for ops playbooks
- Trigger `expo-master` agent for adding features
