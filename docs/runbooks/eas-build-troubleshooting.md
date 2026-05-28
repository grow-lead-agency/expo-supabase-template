# Runbook: EAS Build troubleshooting

Common EAS Build failures with this template + fixes.

## Quick triage

```bash
# 1. Tail the EAS build log for the most recent build
eas build:list --limit 1 --json | jq -r '.[0].logsUrl'
# Open URL in browser — search for "error" / "FAILURE"

# 2. Verify env vars made it
eas secret:list

# 3. Verify the build profile resolves correctly
eas build:inspect --profile preview --platform ios
```

## Failure: `react-native-worklets/plugin not found` or `Cannot find plugin react-native-reanimated/plugin`

**Symptom:** Build fails in Metro bundler step with babel plugin resolution error.

**Cause:** Expo SDK 56 / Reanimated 4 moved the babel plugin from `react-native-reanimated/plugin` to `react-native-worklets/plugin`. Old tutorials still reference the old path.

**Fix:** In `babel.config.js`, plugins array MUST list `react-native-worklets/plugin` LAST:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... other plugins ...
      'react-native-worklets/plugin', // ⚠️ MUST be last
    ],
  };
};
```

## Failure: NativeWind classes not rendering / `unknown utility class` warnings

**Symptom:** Components have `className="flex p-4"` but render with no styling. Console warns about unknown classes.

**Cause:** Tailwind v4 installed transitively. NativeWind v4 is incompatible with Tailwind v4 — config format changed.

**Fix:** Pin Tailwind in `package.json`:

```json
"devDependencies": {
  "tailwindcss": "^3.4"
}
```

Then: `bun install` and `rm -rf node_modules/.cache .expo` before retrying.

## Failure: `EXPO_PUBLIC_SUPABASE_URL is not defined` in build artifact

**Symptom:** App opens but crashes immediately on auth screen, or build log shows "Environment variable X is undefined".

**Cause:** `.env.local` is gitignored — EAS cloud runner doesn't have access. Secrets must be pushed to EAS Secrets explicitly.

**Fix:**

```bash
bin/eas-secrets.sh
eas secret:list  # verify all EXPO_PUBLIC_* are present
```

Re-trigger build. EAS injects them at build time per `eas.json` `env` block.

## Failure: iOS build fails with "No matching provisioning profile"

**Symptom:** EAS log: `error: No profiles for 'cz.client.app' were found`.

**Cause:** First-time build, EAS hasn't generated certificates + provisioning profile yet for this bundle ID.

**Fix:**

```bash
eas credentials
# Select: iOS → Production → "Set up Distribution Certificate" + "Set up Provisioning Profile"
# Use EAS-managed credentials (recommended) — answers most prompts with "yes"
```

Re-trigger build. EAS will use the newly generated profile.

## Failure: `Android Gradle build failed` with `Could not resolve all artifacts`

**Symptom:** Android-only failure during `bunx expo prebuild` or EAS Android build.

**Cause:** Usually a peer dep mismatch with `react-native-reanimated`, `react-native-screens`, or `react-native-safe-area-context`.

**Fix:**

```bash
bunx expo install --check
# Approve any version corrections it suggests
bunx expo install --fix
```

Then retry the build.

## Failure: Build queues for >30 min

**Symptom:** Build sits in queue, never starts.

**Cause:** Free tier queue saturation (Mon-Fri 09:00-17:00 PT peak).

**Fix:**
- Wait (free tier is best-effort).
- Or upgrade to EAS Production tier ($29/mo) for priority queue.
- Or build locally: `eas build --local --profile preview --platform ios` (requires Mac + Xcode).

## Failure: TestFlight build doesn't appear after `eas submit`

**Symptom:** `eas submit` succeeds, but TestFlight shows nothing.

**Cause 1:** App Store Connect processing delay (5-30 min normal).

**Cause 2:** Missing export compliance — open ASC, find build, answer encryption questions.

**Cause 3:** Build was rejected silently — check email tied to `APPLE_ID` in `.env.local`.

**Fix:** Wait 30 min, then check `eas submit --json | jq` for the actual ASC status.

## Reference

- EAS Build docs: https://docs.expo.dev/build/introduction/
- Expo SDK 56 release notes: https://expo.dev/changelog/sdk-56
- `expo` skill: `~/Developer/agents-and-skills/skills/dev/coding/expo/SKILL.md`
- `expo-master` agent: `~/Developer/agents-and-skills/skills/dev/coding/expo-master/agent.md`
